import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../../env";
import { assertAdminSecret } from "../../lib/auth";
import { AdminRepository } from "./admin.repo";
import { AdminService } from "./admin.service";

const ledgerQuerySchema = z.object({
  owner_id: z.string().min(1).optional(),
  session_id: z.string().uuid().optional(),
  decision_id: z.string().uuid().optional()
});

export const adminRoute: FastifyPluginAsync = async (app) => {
  const service = new AdminService(new AdminRepository(app.db));

  app.addHook("onRequest", async (request) => {
    if (!request.url.startsWith("/api/admin/")) {
      return;
    }
    assertAdminSecret(request.headers, env.ADMIN_API_SECRET);
  });

  app.get("/api/admin/runtimes/:id", async (request) => {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    return {
      dev_only: true,
      data: await service.getRuntime(params.id)
    };
  });

  app.get("/api/admin/decisions/:id", async (request) => {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    return {
      dev_only: true,
      data: await service.getDecision(params.id)
    };
  });

  app.get("/api/admin/decisions/:id/actions", async (request) => {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    return {
      dev_only: true,
      data: await service.listDecisionActions(params.id)
    };
  });

  app.get("/api/admin/runtimes/:id/events", async (request) => {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    return {
      dev_only: true,
      data: await service.listRuntimeEvents(params.id)
    };
  });

  app.get("/api/admin/runtimes/:id/commands", async (request) => {
    const params = z.object({ id: z.string().uuid() }).parse(request.params);
    return {
      dev_only: true,
      data: await service.listRuntimeCommands(params.id)
    };
  });

  app.get("/api/admin/ledger", async (request) => {
    const query = ledgerQuerySchema.parse(request.query);
    const filters: {
      ownerId?: string;
      sessionId?: string;
      decisionId?: string;
    } = {};

    if (query.owner_id) {
      filters.ownerId = query.owner_id;
    }
    if (query.session_id) {
      filters.sessionId = query.session_id;
    }
    if (query.decision_id) {
      filters.decisionId = query.decision_id;
    }

    return {
      dev_only: true,
      data: await service.listLedgerEntries(filters),
      todo: "Replace x-admin-secret with stronger admin auth outside local/dev."
    };
  });
};
