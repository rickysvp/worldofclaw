import type { PlatformRequest } from "../types";
import { plansController } from "../controllers/plans.controller";
export const handlePlansRoute = (request: PlatformRequest) => plansController(request);
