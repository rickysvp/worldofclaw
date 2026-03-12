import type { BridgeRequest } from "../../../../packages/skill-bridge/src";
import { actionController } from "../controllers/action.controller";

export const handleSubmitActionRoute = (request: BridgeRequest<unknown>) => actionController(request);
