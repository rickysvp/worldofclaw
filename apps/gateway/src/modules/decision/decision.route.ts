import type { FastifyPluginAsync } from "fastify";
import { env } from "../../env";
import { getRuntimeAuthTokenHash } from "../../lib/auth";
import { DecisionRepository } from "./decision.repo";
import { DecisionService } from "./decision.service";
import { decisionNeededSchema } from "./decision.schema";
import { TelegramSenderService } from "../telegram/telegram.sender";

export const decisionRoute: FastifyPluginAsync = async (app) => {
  const repo = new DecisionRepository(app.db);
  const telegramSender = new TelegramSenderService(app.log);
  const service = new DecisionService(repo, telegramSender);

  app.post("/api/runtime/events/decision-needed", async (request, reply) => {
    const input = decisionNeededSchema.parse(request.body);
    const authTokenHash = getRuntimeAuthTokenHash(request.headers, env.RUNTIME_TOKEN_SECRET);
    const runtime = await repo.findRuntimeByIdAndTokenHash(input.runtime_id, authTokenHash);
    if (!runtime) {
      return reply.code(401).send({
        error: "RUNTIME_AUTH_INVALID"
      });
    }

    const result = await service.createDecision(input);
    return reply.code(201).send(result);
  });
};
