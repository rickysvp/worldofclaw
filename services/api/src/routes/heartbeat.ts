import type { BridgeRequest } from "../../../../packages/skill-bridge/src";
import { heartbeatController } from "../controllers/heartbeat.controller";

export const handleHeartbeatRoute = (request: BridgeRequest<unknown>) => heartbeatController(request);
