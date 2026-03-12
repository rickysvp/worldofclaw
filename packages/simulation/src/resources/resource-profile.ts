import type { Sector } from "../../../schemas/src";
import { getSectorResourceCapRule } from "../../../rules/src";

export const getSectorResourceCap = (sector: Sector) => getSectorResourceCapRule(sector);
