import type { AdminRequest } from "../services/types";
import { facilitiesController } from "../controllers/facilities.controller";
export const handleFacilitiesRoute = (request: AdminRequest) => facilitiesController(request);
