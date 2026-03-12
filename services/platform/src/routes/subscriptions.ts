import type { PlatformRequest } from "../types";
import { subscriptionsController } from "../controllers/subscriptions.controller";
export const handleSubscriptionsRoute = (request: PlatformRequest) => subscriptionsController(request);
