import type { FastifyPluginAsync } from "fastify";
import { env } from "../../env";
import { getRuntimeAuthTokenHash } from "../../lib/auth";
import { RuntimeRepository } from "./runtime.repo";
import { RuntimeService } from "./runtime.service";
import {
  runtimeActionResultSchema,
  runtimeCommandsPollQuerySchema,
  runtimeHeartbeatSchema,
  runtimeRegisterSchema
} from "./runtime.schema";

export const runtimeRoute: FastifyPluginAsync = async (app) => {
  const repo = new RuntimeRepository(app.db);
  const service = new RuntimeService(repo);

  app.post("/api/runtime/register", async (request, reply) => {
    const input = runtimeRegisterSchema.parse(request.body);
    const result = await service.registerRuntime(input);
    return reply.code(201).send(result);
  });

  app.post("/api/runtime/heartbeat", async (request, reply) => {
    const input = runtimeHeartbeatSchema.parse(request.body);
    const authTokenHash = getRuntimeAuthTokenHash(request.headers, env.RUNTIME_TOKEN_SECRET);
    const result = await service.heartbeat(input, authTokenHash);
    return reply.code(200).send(result);
  });

  app.get("/api/runtime/commands/poll", async (request, reply) => {
    const input = runtimeCommandsPollQuerySchema.parse(request.query);
    const authTokenHash = getRuntimeAuthTokenHash(request.headers, env.RUNTIME_TOKEN_SECRET);
    const result = await service.pollCommands(input, authTokenHash);
    return reply.code(200).send(result);
  });

  app.post("/api/runtime/events/action-result", async (request, reply) => {
    const input = runtimeActionResultSchema.parse(request.body);
    const authTokenHash = getRuntimeAuthTokenHash(request.headers, env.RUNTIME_TOKEN_SECRET);
    const result = await service.recordActionResult(input, authTokenHash);
    return reply.code(202).send(result);
  });
};
