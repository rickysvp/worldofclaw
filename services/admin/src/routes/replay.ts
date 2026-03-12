import type { AdminRequest } from "../services/types";
import { replayController } from "../controllers/replay.controller";
export const handleReplayRoute = (request: AdminRequest) => replayController(request);
