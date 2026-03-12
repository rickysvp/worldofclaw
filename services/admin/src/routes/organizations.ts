import type { AdminRequest } from "../services/types";
import { organizationsController } from "../controllers/organizations.controller";
export const handleOrganizationsRoute = (request: AdminRequest) => organizationsController(request);
