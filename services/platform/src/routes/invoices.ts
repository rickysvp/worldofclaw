import type { PlatformRequest } from "../types";
import { invoicesController } from "../controllers/invoices.controller";
export const handleInvoicesRoute = (request: PlatformRequest) => invoicesController(request);
