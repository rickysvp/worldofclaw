import type { AdminRequest } from "../services/types";
import { sessionsController } from "../controllers/sessions.controller";
export const handleSessionsRoute = (request: AdminRequest) => sessionsController(request);
