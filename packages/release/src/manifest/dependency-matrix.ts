import type { DependencyMatrix } from "../release.types";

export const buildDependencyMatrix = (): DependencyMatrix => [
  { module: "skill_bridge", depends_on: ["simulation", "schemas", "rules"] },
  { module: "admin", depends_on: ["audit", "logger", "session_service"] },
  { module: "platform", depends_on: ["access_control", "billing", "risk"] },
  { module: "recovery", depends_on: ["audit", "simulation", "session_service"] }
];
