import type { FastifyBaseLogger } from "fastify";
import { env } from "../env";
import { DecisionRepository } from "../modules/decision/decision.repo";
import { DecisionService } from "../modules/decision/decision.service";
import { TelegramRepository } from "../modules/telegram/telegram.repo";
import { TelegramSenderService } from "../modules/telegram/telegram.sender";
import { TelegramService } from "../modules/telegram/telegram.service";
import type { db } from "../db/client";

type Database = typeof db;

export const startDecisionTimeoutJob = (database: Database, logger: FastifyBaseLogger) => {
  const sender = new TelegramSenderService(logger);
  const decisionService = new DecisionService(new DecisionRepository(database), sender);
  const telegramService = new TelegramService(new TelegramRepository(database), decisionService, sender);

  const interval = setInterval(async () => {
    try {
      await decisionService.expirePendingDecisions(env.DECISION_TIMEOUT_BATCH_SIZE);
      await telegramService.scanAndNotifyStaleRuntimes();
    } catch (error) {
      logger.error(error, "decision timeout scan failed");
    }
  }, env.DECISION_TIMEOUT_SCAN_INTERVAL_MS);

  interval.unref();

  return () => clearInterval(interval);
};
