import type { FastifyPluginAsync } from "fastify";
import { WorldRepository } from "./world.repo";
import { WorldService } from "./world.service";

export const worldRoute: FastifyPluginAsync = async (app) => {
  const repo = new WorldRepository(app.db);
  const service = new WorldService(repo);

  app.get("/api/world/status", async (_request, reply) => {
    const result = await service.getStatus();
    return reply.code(200).send(result);
  });

  app.get("/api/world/runtimes", async (_request, reply) => {
    const result = await service.getRuntimes();
    return reply.code(200).send(result);
  });

  app.get<{ Querystring: { limit?: string } }>(
    "/api/world/events",
    async (request, reply) => {
      const limit = request.query.limit ? parseInt(request.query.limit, 10) : 50;
      const result = await service.getEvents(limit);
      return reply.code(200).send(result);
    }
  );
};
