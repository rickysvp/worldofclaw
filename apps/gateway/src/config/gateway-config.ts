import { parse } from "yaml";
import { z } from "zod";
import { loadDecisionRulesConfig, loadLedgerSchemaConfig } from "../../../../packages/config-loader/src/index";

const decisionRuleSchema = z.object({
  label: z.string().min(1),
  timeout_seconds: z.coerce.number().int().positive(),
  timeout_behavior: z.string().min(1),
  generates_command_type: z.string().min(1),
  allowed_user_responses: z.array(z.string().min(1)).min(1)
});

const decisionRulesConfigSchema = z.object({
  decision_channels: z.object({
    telegram_primary: z.object({
      channel_id: z.string().min(1)
    }).optional()
  }),
  decision_types: z.record(decisionRuleSchema)
});

const ledgerSchemaConfig = z.object({
  ledger_domains: z.record(
    z.object({
      description: z.string().min(1)
    })
  )
});

export type DecisionRuleDefinition = z.infer<typeof decisionRuleSchema>;

export type GatewayConfig = {
  decisionRules: Record<string, DecisionRuleDefinition>;
  hasTelegramPrimary: boolean;
  ledgerDomains: ReadonlySet<string>;
};

let cachedConfig: GatewayConfig | null = null;

export const loadGatewayConfig = (): GatewayConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsedDecisionRules = decisionRulesConfigSchema.parse(parse(loadDecisionRulesConfig().raw));
  const parsedLedgerSchema = ledgerSchemaConfig.parse(parse(loadLedgerSchemaConfig().raw));

  cachedConfig = {
    decisionRules: parsedDecisionRules.decision_types,
    hasTelegramPrimary: Boolean(parsedDecisionRules.decision_channels.telegram_primary),
    ledgerDomains: new Set(Object.keys(parsedLedgerSchema.ledger_domains))
  };

  return cachedConfig;
};

export const getDecisionRule = (decisionType: string): DecisionRuleDefinition | null => {
  const config = loadGatewayConfig();
  return config.decisionRules[decisionType] ?? null;
};
