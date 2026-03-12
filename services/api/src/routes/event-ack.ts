import type { BridgeRequest } from "../../../../packages/skill-bridge/src";
import { eventAckController } from "../controllers/event-ack.controller";

export const handleEventAckRoute = (request: BridgeRequest<unknown>) => eventAckController(request);
