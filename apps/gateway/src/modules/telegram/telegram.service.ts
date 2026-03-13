import { createHash } from "node:crypto";
import { env } from "../../env";
import { AppError } from "../../lib/errors";
import { hashIdempotencyRequest } from "../../lib/tokens";
import { DecisionService } from "../decision/decision.service";
import { decisionModifyFieldSchema } from "../decision/decision.schema";
import type { TelegramSender } from "./telegram.sender";
import { TelegramRepository } from "./telegram.repo";
import type { TelegramUpdate } from "./telegram.schema";

type ParsedCommand =
  | { kind: "start" }
  | { kind: "link"; code: string }
  | { kind: "status" }
  | { kind: "approve"; decisionId: string }
  | { kind: "reject"; decisionId: string }
  | { kind: "modify"; decisionId: string; field: "quantity" | "budget_cap" | "route_risk"; value: string };

export class TelegramService {
  constructor(
    private readonly repo: TelegramRepository,
    private readonly decisionService: DecisionService,
    private readonly sender: TelegramSender
  ) {}

  async handleUpdate(update: TelegramUpdate) {
    const message = update.message;
    if (!message) {
      return {
        accepted: true,
        ignored: true
      };
    }

    const parsed = this.parseCommand(message.text);
    const idempotencyKey = this.createIdempotencyKey(message.chat.id, message.message_id, message.text);
    const existing = await this.repo.findIdempotencyKey("telegram:command", idempotencyKey);
    if (existing) {
      return {
        accepted: true,
        idempotent: true
      };
    }

    await this.repo.createIdempotencyKey({
      scope: "telegram:command",
      idemKey: idempotencyKey,
      requestHash: hashIdempotencyRequest(update),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    try {
      const result = await this.executeCommand(parsed, {
        chatId: message.chat.id,
        telegramUserId: message.from.id,
        messageId: message.message_id,
        idempotencyKey
      });

      await this.repo.createAuditLog({
        actorType: "telegram",
        actorRef: message.chat.id,
        action: `telegram_${parsed.kind}`,
        targetType: parsed.kind === "status" || parsed.kind === "start" || parsed.kind === "link" ? "telegram_chat" : "decision",
        targetId: "decisionId" in parsed ? parsed.decisionId : message.chat.id,
        correlationId: `telegram:${message.message_id}`,
        payloadJson: {
          command: parsed,
          result
        }
      });

      return {
        accepted: true,
        idempotent: false
      };
    } catch (error) {
      const code = error instanceof AppError ? error.code : "TELEGRAM_COMMAND_FAILED";
      await this.sender.sendRawMessage({
        chatId: message.chat.id,
        text: code
      });

      await this.repo.createAuditLog({
        actorType: "telegram",
        actorRef: message.chat.id,
        action: `telegram_${parsed.kind}_failed`,
        targetType: "telegram_chat",
        targetId: message.chat.id,
        correlationId: `telegram:${message.message_id}`,
        payloadJson: {
          command: parsed,
          error_code: code
        }
      });

      throw error;
    }
  }

  async scanAndNotifyStaleRuntimes() {
    const staleBefore = new Date(Date.now() - env.HEARTBEAT_STALE_AFTER_SECONDS * 1000);
    const staleLinks = await this.repo.listStaleActiveLinks(staleBefore);

    for (const staleLink of staleLinks) {
      await this.repo.markRuntimeStale(staleLink.runtimeId);
      await this.sender.sendRuntimeStaleNotice({
        chatId: staleLink.telegramChatId,
        clawName: staleLink.clawName,
        runtimeId: staleLink.runtimeId
      });
      await this.repo.createAuditLog({
        actorType: "system",
        actorRef: "runtime_stale_monitor",
        action: "runtime_marked_stale",
        targetType: "runtime",
        targetId: staleLink.runtimeId,
        correlationId: null,
        payloadJson: {
          telegram_chat_id: staleLink.telegramChatId
        }
      });
    }
  }

  private async executeCommand(
    parsed: ParsedCommand,
    context: { chatId: string; telegramUserId: string; messageId: number; idempotencyKey: string }
  ) {
    if (parsed.kind === "start") {
      await this.sender.sendRawMessage({
        chatId: context.chatId,
        text: "我是你的 Claw 决策入口。先发送 /link <code> 完成绑定。"
      });
      return { status: "started" };
    }

    if (parsed.kind === "link") {
      const link = await this.repo.findLinkByCode(parsed.code);
      if (!link) {
        throw new AppError("TELEGRAM_LINK_CODE_INVALID", 404);
      }

      if (link.status === "active" && link.telegramChatId === context.chatId) {
        const clawName = await this.repo.findClawNameByUser(link.userId);
        await this.sender.sendLinkedSuccess({
          chatId: context.chatId,
          clawName,
          linkCode: parsed.code
        });
        return { status: "linked", idempotent: true };
      }

      if (link.status === "active") {
        throw new AppError("TELEGRAM_LINK_ALREADY_USED", 409);
      }

      const activated = await this.repo.activateLink({
        linkId: link.id,
        chatId: context.chatId,
        telegramUserId: context.telegramUserId
      });
      if (!activated) {
        throw new AppError("TELEGRAM_LINK_ACTIVATE_FAILED", 500);
      }
      const clawName = await this.repo.findClawNameByUser(activated.userId);
      await this.sender.sendLinkedSuccess({
        chatId: context.chatId,
        clawName,
        linkCode: parsed.code
      });
      return { status: "linked", user_id: activated.userId };
    }

    const activeLink = await this.repo.findActiveLinkByChatId(context.chatId);
    if (!activeLink) {
      throw new AppError("TELEGRAM_BINDING_NOT_FOUND", 403);
    }

    if (parsed.kind === "status") {
      const summary = await this.repo.getStatusSummaryByUser(activeLink.userId);
      if (!summary) {
        throw new AppError("RUNTIME_STATUS_NOT_FOUND", 404);
      }

      await this.sender.sendStatusSummary({
        chatId: context.chatId,
        clawName: summary.clawName,
        runtimeStatus: summary.status,
        currentSector: summary.currentSector ?? "unknown",
        power: summary.power ?? 0,
        durability: summary.durability ?? 0,
        credits: summary.credits ?? 0,
        currentAction: summary.currentAction ?? "idle",
        pendingDecisionCount: summary.pendingDecisionCount,
        lastSeenAt: summary.lastSeenAt?.toISOString() ?? null
      });

      return {
        status: "reported"
      };
    }

    const actor = {
      actorType: "telegram" as const,
      actorRef: `${context.chatId}:${context.telegramUserId}`,
      idempotencyKey: context.idempotencyKey,
      correlationId: `telegram:${context.messageId}`,
      userId: activeLink.userId
    };

    if (parsed.kind === "approve") {
      return this.decisionService.approveDecision(parsed.decisionId, actor);
    }

    if (parsed.kind === "reject") {
      return this.decisionService.rejectDecision(parsed.decisionId, actor);
    }

    return this.decisionService.modifyDecision(parsed.decisionId, parsed.field, parsed.value, actor);
  }

  private parseCommand(text: string): ParsedCommand {
    const normalized = text.trim();
    if (normalized === "/start") {
      return { kind: "start" };
    }

    if (normalized === "/status") {
      return { kind: "status" };
    }

    const linkMatch = normalized.match(/^\/link\s+(.+)$/);
    if (linkMatch) {
      const code = linkMatch[1];
      if (!code) {
        throw new AppError("TELEGRAM_LINK_CODE_INVALID", 400);
      }
      return {
        kind: "link",
        code: code.trim()
      };
    }

    const approveMatch = normalized.match(/^\/approve\s+([0-9a-f-]{36})$/i);
    if (approveMatch) {
      const decisionId = approveMatch[1];
      if (!decisionId) {
        throw new AppError("DECISION_NOT_FOUND", 400);
      }
      return {
        kind: "approve",
        decisionId
      };
    }

    const rejectMatch = normalized.match(/^\/reject\s+([0-9a-f-]{36})$/i);
    if (rejectMatch) {
      const decisionId = rejectMatch[1];
      if (!decisionId) {
        throw new AppError("DECISION_NOT_FOUND", 400);
      }
      return {
        kind: "reject",
        decisionId
      };
    }

    const modifyMatch = normalized.match(/^\/modify\s+([0-9a-f-]{36})\s+([a-z_]+)\s+(.+)$/i);
    if (modifyMatch) {
      const decisionId = modifyMatch[1];
      const fieldRaw = modifyMatch[2];
      const value = modifyMatch[3];
      if (!decisionId || !fieldRaw || !value) {
        throw new AppError("COMMAND_PATCH_INVALID", 400);
      }
      const field = decisionModifyFieldSchema.parse(fieldRaw);
      return {
        kind: "modify",
        decisionId,
        field,
        value: value.trim()
      };
    }

    throw new AppError("TELEGRAM_COMMAND_UNSUPPORTED", 400);
  }

  private createIdempotencyKey(chatId: string, messageId: number, text: string) {
    const commandHash = createHash("sha256").update(text).digest("hex").slice(0, 12);
    return `telegram:${chatId}:${messageId}:${commandHash}`;
  }
}
