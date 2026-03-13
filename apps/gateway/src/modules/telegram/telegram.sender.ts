import type { FastifyBaseLogger } from "fastify";
import { env } from "../../env";
import {
  buildDecisionRequestMessage,
  buildDecisionResolvedMessage,
  buildLinkedSuccessMessage,
  buildRuntimeStaleNoticeMessage,
  buildStatusSummaryMessage,
  buildTimeoutNoticeMessage
} from "./telegram.templates";

type SendRequest = {
  chatId: string;
  text: string;
};

export interface TelegramSender {
  sendRawMessage(input: SendRequest): Promise<void>;
  sendLinkedSuccess(input: { chatId: string; clawName: string; linkCode: string }): Promise<void>;
  sendStatusSummary(input: {
    chatId: string;
    clawName: string;
    runtimeStatus: string;
    currentSector: string;
    power: number;
    durability: number;
    credits: number;
    currentAction: string;
    pendingDecisionCount: number;
    lastSeenAt: string | null;
  }): Promise<void>;
  sendDecisionRequest(input: {
    chatId: string;
    decisionId: string;
    decisionType: string;
    title: string;
    clawName: string;
    reason: string;
    riskLevel: string;
    recommendedOption: string;
    expiresAt: string;
    timeoutBehavior: string;
  }): Promise<void>;
  sendDecisionResolved(input: {
    chatId: string;
    decisionId: string;
    clawName: string;
    resolution: string;
    summary: string;
  }): Promise<void>;
  sendTimeoutNotice(input: {
    chatId: string;
    decisionId: string;
    clawName: string;
    timeoutBehavior: string;
  }): Promise<void>;
  sendRuntimeStaleNotice(input: { chatId: string; clawName: string; runtimeId: string }): Promise<void>;
}

export class TelegramSenderService implements TelegramSender {
  constructor(private readonly logger: FastifyBaseLogger) {}

  async sendRawMessage(input: SendRequest) {
    if (env.TELEGRAM_BOT_TOKEN === "telegram_bot_token_placeholder") {
      this.logger.info({ telegram: input }, "telegram send skipped because TELEGRAM_BOT_TOKEN is placeholder");
      return;
    }

    await fetch(
      `${env.TELEGRAM_BOT_API_BASE_URL}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          chat_id: input.chatId,
          text: input.text
        })
      }
    );
  }

  async sendLinkedSuccess(input: { chatId: string; clawName: string; linkCode: string }) {
    await this.sendRawMessage({
      chatId: input.chatId,
      text: buildLinkedSuccessMessage(input.clawName, input.linkCode)
    });
  }

  async sendStatusSummary(input: {
    chatId: string;
    clawName: string;
    runtimeStatus: string;
    currentSector: string;
    power: number;
    durability: number;
    credits: number;
    currentAction: string;
    pendingDecisionCount: number;
    lastSeenAt: string | null;
  }) {
    await this.sendRawMessage({
      chatId: input.chatId,
      text: buildStatusSummaryMessage(input)
    });
  }

  async sendDecisionRequest(input: {
    chatId: string;
    decisionId: string;
    decisionType: string;
    title: string;
    clawName: string;
    reason: string;
    riskLevel: string;
    recommendedOption: string;
    expiresAt: string;
    timeoutBehavior: string;
  }) {
    await this.sendRawMessage({
      chatId: input.chatId,
      text: buildDecisionRequestMessage(input)
    });
  }

  async sendDecisionResolved(input: {
    chatId: string;
    decisionId: string;
    clawName: string;
    resolution: string;
    summary: string;
  }) {
    await this.sendRawMessage({
      chatId: input.chatId,
      text: buildDecisionResolvedMessage(input)
    });
  }

  async sendTimeoutNotice(input: {
    chatId: string;
    decisionId: string;
    clawName: string;
    timeoutBehavior: string;
  }) {
    await this.sendRawMessage({
      chatId: input.chatId,
      text: buildTimeoutNoticeMessage(input.clawName, input.decisionId, input.timeoutBehavior)
    });
  }

  async sendRuntimeStaleNotice(input: { chatId: string; clawName: string; runtimeId: string }) {
    await this.sendRawMessage({
      chatId: input.chatId,
      text: buildRuntimeStaleNoticeMessage(input.clawName, input.runtimeId)
    });
  }
}
