import type { AdminRequest } from "../services/types";
import { alertsController } from "../controllers/alerts.controller";
export const handleAlertsRoute = (request: AdminRequest) => alertsController(request);
