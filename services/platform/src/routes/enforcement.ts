import type { PlatformRequest } from "../types";
import { enforcementController } from "../controllers/enforcement.controller";
export const handleEnforcementRoute = (request: PlatformRequest) => enforcementController(request);
