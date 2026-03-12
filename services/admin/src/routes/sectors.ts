import type { AdminRequest } from "../services/types";
import { sectorsController } from "../controllers/sectors.controller";
export const handleSectorsRoute = (request: AdminRequest) => sectorsController(request);
