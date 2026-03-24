import type { FastifyPluginAsync } from "fastify";
import { PublicRepository } from "./public.repo";
import {
  leaderboardResponseSchema,
  worldFeedResponseSchema,
  worldStatusResponseSchema
} from "./public.schema";
import { PublicService } from "./public.service";

export const publicRoute: FastifyPluginAsync = async (app) => {
  const service = new PublicService(new PublicRepository(app.db));

  app.get("/api/public/world-feed", async () => {
    return worldFeedResponseSchema.parse(await service.getWorldFeed());
  });

  app.get("/api/public/leaderboard", async () => {
    return leaderboardResponseSchema.parse(await service.getLeaderboard());
  });

  app.get("/api/public/world-status", async () => {
    return worldStatusResponseSchema.parse(await service.getWorldStatus());
  });
};
