import type { BridgeRequest } from "../../../../packages/skill-bridge/src";
import { stateController } from "../controllers/state.controller";

export const handleWorldStateRoute = (request: BridgeRequest<undefined>) => stateController(request, request.headers?.authorization);
