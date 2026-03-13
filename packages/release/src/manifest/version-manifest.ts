import type { VersionManifest } from "../release.types";

export const buildVersionManifest = (version: string, modules: string[]): VersionManifest => ({
  version,
  modules,
  generated_at: new Date().toISOString()
});
