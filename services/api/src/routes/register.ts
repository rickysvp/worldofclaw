import type { BridgeRequest } from "../../../../packages/skill-bridge/src";
import { registerController } from "../controllers/register.controller";

export const handleRegisterRoute = (request: BridgeRequest<unknown>) => registerController(request);
