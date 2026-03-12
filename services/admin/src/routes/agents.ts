import type { AdminRequest } from "../services/types";
import { agentsController } from "../controllers/agents.controller";
export const handleAgentsRoute = (request: AdminRequest) => agentsController(request);
