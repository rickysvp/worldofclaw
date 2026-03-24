import type { FastifyPluginAsync } from "fastify";
import {
  clawSummaryResponseSchema,
  ledgerSummaryResponseSchema,
  meViewerQuerySchema,
  pendingDecisionsResponseSchema,
  runtimeEventsResponseSchema
} from "./me.schema";
import { MeRepository } from "./me.repo";
import { MeService } from "./me.service";

export const meRoute: FastifyPluginAsync = async (app) => {
  const service = new MeService(new MeRepository(app.db));

  app.get("/api/me/claw-summary", async (request) => {
    const query = meViewerQuerySchema.parse(request.query);
    return clawSummaryResponseSchema.parse(await service.getClawSummary(query.user_ref));
  });

  app.get("/api/me/pending-decisions", async (request) => {
    const query = meViewerQuerySchema.parse(request.query);
    return pendingDecisionsResponseSchema.parse(await service.getPendingDecisions(query.user_ref));
  });

  app.get("/api/me/runtime-events", async (request) => {
    const query = meViewerQuerySchema.parse(request.query);
    return runtimeEventsResponseSchema.parse(await service.getRuntimeEvents(query.user_ref));
  });

  app.get("/api/me/ledger-summary", async (request) => {
    const query = meViewerQuerySchema.parse(request.query);
    return ledgerSummaryResponseSchema.parse(await service.getLedgerSummary(query.user_ref));
  });
};
