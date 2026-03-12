import type { PlatformRequest } from "../types";
import { usageController } from "../controllers/usage.controller";
export const handleUsageRoute = (request: PlatformRequest) => usageController(request);
