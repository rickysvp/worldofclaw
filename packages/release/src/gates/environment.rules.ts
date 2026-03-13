import type { EnvironmentReadiness, ReleaseEnvironment } from "../release.types";

const required_keys: Record<ReleaseEnvironment, string[]> = {
  staging: ["OPENCLAW_ADMIN_TOKEN"],
  production: ["OPENCLAW_ADMIN_TOKEN", "OPENCLAW_WORLD_ID"]
};

export const evaluateEnvironmentReadiness = (environment: ReleaseEnvironment, env: Record<string, string | undefined>): EnvironmentReadiness => {
  const missing_keys = required_keys[environment].filter((key) => !env[key]);
  return {
    environment,
    ready: missing_keys.length === 0,
    missing_keys
  };
};
