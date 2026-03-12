import type { BridgeRequest } from "../../../../packages/skill-bridge/src";
import { claimController } from "../controllers/claim.controller";

export const handleClaimRoute = (request: BridgeRequest<unknown>) => claimController(request);
