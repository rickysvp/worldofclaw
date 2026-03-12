import type { PlatformRequest } from "../types";
import { disputesController } from "../controllers/disputes.controller";
export const handleDisputesRoute = (request: PlatformRequest) => disputesController(request);
