import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { db, dbPool } from "./db/client";
import { startDecisionTimeoutJob } from "./jobs/decision-timeout.job";
import { adminRoute } from "./modules/admin/admin.route";
import { decisionRoute } from "./modules/decision/decision.route";
import { healthRoute } from "./modules/health/health.route";
import { runtimeRoute } from "./modules/runtime/runtime.route";
import { telegramRoute } from "./modules/telegram/telegram.route";
import { worldRoute } from "./modules/world/world.route";
import { isAppError } from "./lib/errors";

declare module "fastify" {
  interface FastifyInstance {
    db: typeof db;
  }
}

export const buildApp = (): FastifyInstance => {
  const app = Fastify({ logger: true });

  app.decorate("db", db);

  app.register(healthRoute);
  app.register(runtimeRoute);
  app.register(decisionRoute);
  app.register(telegramRoute);
  app.register(worldRoute);
  app.register(adminRoute);

  const stopTimeoutJob = startDecisionTimeoutJob(db, app.log);

  app.setErrorHandler((error: unknown, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        error: "VALIDATION_ERROR",
        issues: error.issues
      });
    }

    if (isAppError(error)) {
      return reply.code(error.statusCode).send({
        error: error.code,
        details: error.details
      });
    }

    app.log.error(error);
    const message = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";
    return reply.code(500).send({
      error: message
    });
  });

  app.addHook("onClose", async () => {
    stopTimeoutJob();
    await dbPool.end();
  });

  return app;
};
