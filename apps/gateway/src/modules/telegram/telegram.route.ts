import type { FastifyPluginAsync } from "fastify";
import { env } from "../../env";
import { assertTelegramWebhookSecret } from "../../lib/auth";
import { DecisionRepository } from "../decision/decision.repo";
import { DecisionService } from "../decision/decision.service";
import { TelegramRepository } from "./telegram.repo";
import { TelegramSenderService } from "./telegram.sender";
import { telegramUpdateSchema } from "./telegram.schema";
import { TelegramService } from "./telegram.service";

export const telegramRoute: FastifyPluginAsync = async (app) => {
  const sender = new TelegramSenderService(app.log);
  const decisionService = new DecisionService(new DecisionRepository(app.db), sender);
  const service = new TelegramService(new TelegramRepository(app.db), decisionService, sender);

  app.post("/api/telegram/webhook", async (request, reply) => {
    assertTelegramWebhookSecret(request.headers, env.TELEGRAM_WEBHOOK_SECRET);
    const input = telegramUpdateSchema.parse(request.body);
    const result = await service.handleUpdate(input);
    return reply.code(200).send(result);
  });
};
