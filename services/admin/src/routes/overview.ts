import type { AdminRequest } from "../services/types";
import { overviewController } from "../controllers/overview.controller";
export const handleOverviewRoute = (request: AdminRequest) => overviewController(request);
