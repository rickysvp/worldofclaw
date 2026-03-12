import type { PlatformRequest } from "../types";
import { entitlementsController } from "../controllers/entitlements.controller";
export const handleEntitlementsRoute = (request: PlatformRequest) => entitlementsController(request);
