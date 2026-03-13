import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type LoadedConfig = {
  filePath: string;
  raw: string;
};

const packageDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(packageDir, "../../../");

const readConfig = (relativePath: string): LoadedConfig => {
  const filePath = resolve(repoRoot, relativePath);
  const raw = readFileSync(filePath, "utf8");
  return {
    filePath,
    raw
  };
};

export const loadActionsConfig = (): LoadedConfig => readConfig("config/actions.yaml");
export const loadDecisionRulesConfig = (): LoadedConfig => readConfig("config/decision_rules.yaml");
export const loadLedgerSchemaConfig = (): LoadedConfig => readConfig("config/ledger_schema.yaml");
