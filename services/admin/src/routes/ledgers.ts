import type { AdminRequest } from "../services/types";
import { ledgersController } from "../controllers/ledgers.controller";
export const handleLedgersRoute = (request: AdminRequest) => ledgersController(request);
