import type { AdminRequest } from "../services/types";
import { worldHealthController } from "../controllers/world-health.controller";
export const handleWorldHealthRoute = (request: AdminRequest) => worldHealthController(request);
