import type { BridgeRequest } from "../../../../packages/skill-bridge/src";
import { jobsController } from "../controllers/jobs.controller";

export const handleWorldJobsRoute = (request: BridgeRequest<undefined>) => jobsController(request, request.headers?.authorization);
