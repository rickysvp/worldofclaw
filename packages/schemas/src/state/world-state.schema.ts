import { z } from "zod";
import {
  applyDynamicPrice,
  applyRegionalPrice,
  applyRiskPrice,
  buildQuote,
  getBaseMidPrice,
  npc_market_starting_credits,
  npc_market_entity_prefix,
  platform_treasury_entity_id
} from "../../../economy/src";
import {
  day_length_ticks,
  map_height,
  map_width,
  meteor_max_interval,
  meteor_min_interval,
  newbie_safe_ticks,
  tick_duration_seconds,
  world_constants
} from "../constants/world.constants";
import { contract_schema } from "../entities/contract.schema";
import { event_schema } from "../entities/event.schema";
import { facility_schema } from "../entities/facility.schema";
import { market_order_schema, market_quote_schema, market_trade_schema } from "../entities/market.schema";
import { sector_schema } from "../entities/sector.schema";
import { agent_schema } from "../entities/agent.schema";
import {
  format_zod_error,
  id_list_schema,
  id_schema,
  json_record_schema,
  nullable_id_schema,
  StructuredValidationResult,
  tick_schema
} from "../primitives/common";
import { ledgers_schema } from "./ledgers.schema";
import { terrain_values, tick_phase_enum } from "../constants/enums";

export const world_meta_schema = z.object({
  id: id_schema,
  version: z.number().int().min(1).max(1_000_000),
  created_at_tick: tick_schema,
  updated_at_tick: tick_schema,
  seed: z.string().min(1).max(256),
  schema_version: z.string().min(1).max(32),
  world_name: z.string().min(1).max(128),
  current_tick: tick_schema,
  processed_tick_receipts: z
    .record(
      z.string(),
      z.object({
        receipt_id: id_schema,
        world_id: id_schema,
        tick_number: tick_schema,
        seed: z.string().min(1).max(256),
        idempotency_key: z.string().min(1).max(256),
        phase_order: z.array(tick_phase_enum).readonly(),
        input_checksum: z.string().length(64),
        output_checksum: z.string().length(64),
        action_queue_checksum: z.string().length(64),
        receipt_checksum: z.string().length(64)
      })
    )
    .default({})
});

export const world_config_schema = z
  .object({
    tick_duration_seconds: z.literal(tick_duration_seconds),
    map_width: z.literal(map_width),
    map_height: z.literal(map_height),
    day_length_ticks: z.literal(day_length_ticks),
    newbie_safe_ticks: z.literal(newbie_safe_ticks),
    meteor_min_interval: z.literal(meteor_min_interval),
    meteor_max_interval: z.literal(meteor_max_interval)
  })
  .strict();

export const registries_schema = z.object({
  agents: z.record(id_schema, agent_schema).default({}),
  sectors: z.record(id_schema, sector_schema),
  facilities: z.record(id_schema, facility_schema).default({}),
  contracts: z.record(id_schema, contract_schema).default({}),
  events: z.record(id_schema, event_schema).default({}),
  market_quotes: z.record(id_schema, market_quote_schema).default({}),
  market_orders: z.record(id_schema, market_order_schema).default({}),
  market_trades: z.record(id_schema, market_trade_schema).default({})
});

export const indexes_schema = z.object({
  agent_ids: id_list_schema,
  sector_ids: id_list_schema,
  facility_ids: id_list_schema,
  contract_ids: id_list_schema,
  event_ids: id_list_schema,
  market_quote_ids: id_list_schema.default([]),
  market_order_ids: id_list_schema.default([]),
  market_trade_ids: id_list_schema.default([]),
  agents_by_owner_user_id: z.record(z.string(), z.array(id_schema)).default({}),
  agents_by_location: z.record(z.string(), z.array(id_schema)).default({}),
  facilities_by_sector_id: z.record(z.string(), z.array(id_schema)).default({}),
  sectors_by_coordinate: z.record(z.string(), id_schema),
  neighbor_sector_ids: z.record(z.string(), z.array(id_schema)).default({}),
  facility_coverage_by_sector_id: z.record(z.string(), z.array(id_schema)).default({}),
  contracts_by_agent_id: z.record(z.string(), z.array(id_schema)).default({}),
  events_by_tick: z.record(z.string(), z.array(id_schema)).default({}),
  market_quotes_by_sector_id: z.record(z.string(), z.array(id_schema)).default({}),
  market_orders_by_sector_id: z.record(z.string(), z.array(id_schema)).default({}),
  market_trades_by_tick: z.record(z.string(), z.array(id_schema)).default({})
});

export const world_state_schema = z
  .object({
    meta: world_meta_schema,
    config: world_config_schema,
    registries: registries_schema,
    ledgers: ledgers_schema,
    indexes: indexes_schema
  })
  .superRefine((value, ctx) => {
    const sector_ids = Object.keys(value.registries.sectors);
    const agent_ids = Object.keys(value.registries.agents);
    const facility_ids = Object.keys(value.registries.facilities);
    const contract_ids = Object.keys(value.registries.contracts);
    const event_ids = Object.keys(value.registries.events);
    const market_quote_ids = Object.keys(value.registries.market_quotes);
    const market_order_ids = Object.keys(value.registries.market_orders);
    const market_trade_ids = Object.keys(value.registries.market_trades);

    const assert_exact_match = (index_name: string, expected: string[], actual: string[]) => {
      const sorted_expected = [...expected].sort();
      const sorted_actual = [...actual].sort();
      if (JSON.stringify(sorted_expected) !== JSON.stringify(sorted_actual)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["indexes", index_name],
          message: `${index_name} must match registry keys`
        });
      }
    };

    assert_exact_match("sector_ids", sector_ids, value.indexes.sector_ids);
    assert_exact_match("agent_ids", agent_ids, value.indexes.agent_ids);
    assert_exact_match("facility_ids", facility_ids, value.indexes.facility_ids);
    assert_exact_match("contract_ids", contract_ids, value.indexes.contract_ids);
    assert_exact_match("event_ids", event_ids, value.indexes.event_ids);
    assert_exact_match("market_quote_ids", market_quote_ids, value.indexes.market_quote_ids);
    assert_exact_match("market_order_ids", market_order_ids, value.indexes.market_order_ids);
    assert_exact_match("market_trade_ids", market_trade_ids, value.indexes.market_trade_ids);

    for (const [coordinate, sector_id] of Object.entries(value.indexes.sectors_by_coordinate)) {
      const sector = value.registries.sectors[sector_id];
      if (!sector) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["indexes", "sectors_by_coordinate", coordinate],
          message: "coordinate index references a missing sector"
        });
        continue;
      }
      const expected_coordinate = `${sector.x},${sector.y}`;
      if (coordinate !== expected_coordinate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["indexes", "sectors_by_coordinate", coordinate],
          message: "coordinate index must match sector coordinates"
        });
      }
    }

    for (const [owner_user_id, indexed_agent_ids] of Object.entries(value.indexes.agents_by_owner_user_id)) {
      for (const agent_id of indexed_agent_ids) {
        const agent = value.registries.agents[agent_id];
        if (!agent || agent.owner_user_id !== owner_user_id) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["indexes", "agents_by_owner_user_id", owner_user_id],
            message: "agents_by_owner_user_id contains an invalid agent reference"
          });
        }
      }
    }

    for (const [location, indexed_agent_ids] of Object.entries(value.indexes.agents_by_location)) {
      for (const agent_id of indexed_agent_ids) {
        const agent = value.registries.agents[agent_id];
        if (!agent || agent.location !== location) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["indexes", "agents_by_location", location],
            message: "agents_by_location contains an invalid agent reference"
          });
        }
      }
    }

    for (const [sector_id, indexed_facility_ids] of Object.entries(value.indexes.facilities_by_sector_id)) {
      for (const facility_id of indexed_facility_ids) {
        const facility = value.registries.facilities[facility_id];
        if (!facility || facility.sector_id !== sector_id) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["indexes", "facilities_by_sector_id", sector_id],
            message: "facilities_by_sector_id contains an invalid facility reference"
          });
        }
      }
    }

    for (const [sector_id, neighbor_ids] of Object.entries(value.indexes.neighbor_sector_ids)) {
      const sector = value.registries.sectors[sector_id];
      if (!sector) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["indexes", "neighbor_sector_ids", sector_id],
          message: "neighbor_sector_ids contains an invalid sector key"
        });
        continue;
      }

      for (const neighbor_id of neighbor_ids) {
        if (!value.registries.sectors[neighbor_id]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["indexes", "neighbor_sector_ids", sector_id],
            message: "neighbor_sector_ids references a missing sector"
          });
        }
      }
    }

    for (const [sector_id, covered_facility_ids] of Object.entries(value.indexes.facility_coverage_by_sector_id)) {
      if (!value.registries.sectors[sector_id]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["indexes", "facility_coverage_by_sector_id", sector_id],
          message: "facility_coverage_by_sector_id contains an invalid sector key"
        });
        continue;
      }

      for (const facility_id of covered_facility_ids) {
        if (!value.registries.facilities[facility_id]) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["indexes", "facility_coverage_by_sector_id", sector_id],
            message: "facility_coverage_by_sector_id references a missing facility"
          });
        }
      }
    }

    for (const [sector_id, quote_ids] of Object.entries(value.indexes.market_quotes_by_sector_id)) {
      if (!value.registries.sectors[sector_id]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["indexes", "market_quotes_by_sector_id", sector_id],
          message: "market_quotes_by_sector_id contains an invalid sector key"
        });
        continue;
      }

      for (const quote_id of quote_ids) {
        const quote = value.registries.market_quotes[quote_id];
        if (!quote || quote.sector_id !== sector_id) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["indexes", "market_quotes_by_sector_id", sector_id],
            message: "market_quotes_by_sector_id contains an invalid quote reference"
          });
        }
      }
    }

    for (const [sector_id, order_ids] of Object.entries(value.indexes.market_orders_by_sector_id)) {
      if (!value.registries.sectors[sector_id]) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["indexes", "market_orders_by_sector_id", sector_id],
          message: "market_orders_by_sector_id contains an invalid sector key"
        });
        continue;
      }

      for (const order_id of order_ids) {
        const order = value.registries.market_orders[order_id];
        if (!order || order.sector_id !== sector_id) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["indexes", "market_orders_by_sector_id", sector_id],
            message: "market_orders_by_sector_id contains an invalid order reference"
          });
        }
      }
    }

    for (const [tick, trade_ids] of Object.entries(value.indexes.market_trades_by_tick)) {
      for (const trade_id of trade_ids) {
        const trade = value.registries.market_trades[trade_id];
        if (!trade || String(trade.executed_at_tick) !== tick) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["indexes", "market_trades_by_tick", tick],
            message: "market_trades_by_tick contains an invalid trade reference"
          });
        }
      }
    }
  });

export type WorldMeta = z.infer<typeof world_meta_schema>;
export type WorldConfig = z.infer<typeof world_config_schema>;
export type WorldRegistries = z.infer<typeof registries_schema>;
export type WorldIndexes = z.infer<typeof indexes_schema>;
export type WorldState = z.infer<typeof world_state_schema>;

const terrain_pattern: ReadonlyArray<(typeof terrain_values)[number]> = [
  "safe_zone",
  "ruins",
  "wasteland_route",
  "meteor_crater",
  "industrial_remnant",
  "relay_highland"
];

const create_default_sectors = () => {
  const sectors: Record<string, z.infer<typeof sector_schema>> = {};
  for (let y = 0; y < map_height; y += 1) {
    for (let x = 0; x < map_width; x += 1) {
      const id = `sector_${x}_${y}`;
      const terrain_type = terrain_pattern[(x + y) % terrain_pattern.length] ?? "safe_zone";
      const resource_stock = {
        power: terrain_type === "safe_zone" ? 4 : terrain_type === "relay_highland" ? 2 : 0,
        scrap: terrain_type === "ruins" || terrain_type === "industrial_remnant" ? 8 : 3,
        composite: terrain_type === "industrial_remnant" ? 2 : 0,
        circuit: terrain_type === "relay_highland" ? 2 : 0,
        flux: terrain_type === "meteor_crater" ? 3 : 0,
        xenite: terrain_type === "meteor_crater" ? 1 : 0,
        compute_core: terrain_type === "relay_highland" ? 1 : 0,
        credits: 0
      };
      const resource_regen = {
        power: terrain_type === "safe_zone" ? 1 : 0,
        scrap: terrain_type === "industrial_remnant" ? 1 : 0,
        composite: 0,
        circuit: 0,
        flux: terrain_type === "meteor_crater" ? 1 : 0,
        xenite: 0,
        compute_core: 0,
        credits: 0
      };
      sectors[id] = {
        id,
        version: 1,
        created_at_tick: 0,
        updated_at_tick: 0,
        x,
        y,
        terrain_type,
        danger_level: Math.min(100, (x + y) * 8),
        route_level: terrain_type === "wasteland_route" ? 3 : terrain_type === "safe_zone" ? 2 : 1,
        weather_modifier: terrain_type === "meteor_crater" ? -2 : terrain_type === "relay_highland" ? -1 : 0,
        signal_modifier: terrain_type === "relay_highland" ? 3 : terrain_type === "industrial_remnant" ? 1 : 0,
        discoverability: Math.min(100, x * 10 + y * 5),
        salvage_yield_rating: Math.min(100, 15 + x * 6 + y * 4),
        power_signal_rating: Math.min(100, 10 + x * 4 + y * 7),
        blocked: false,
        facility_slot_count:
          terrain_type === "safe_zone"
            ? 3
            : terrain_type === "industrial_remnant" || terrain_type === "relay_highland" || terrain_type === "ruins"
              ? 2
              : 1,
        access_policy: "open",
        control_state: "uncontrolled",
        controller_owner_user_id: null,
        control_since_tick: null,
        contested_since_tick: null,
        hostile_conflict_ticks: [],
        resource_stock,
        resource_regen,
        facility_ids: [],
        occupant_agent_ids: [],
        controlling_contract_id: null
      };
    }
  }
  return sectors;
};

const build_coordinate_index = (sectors: Record<string, z.infer<typeof sector_schema>>) => {
  const index: Record<string, string> = {};
  for (const sector of Object.values(sectors)) {
    index[`${sector.x},${sector.y}`] = sector.id;
  }
  return index;
};

const build_neighbor_index = (sectors: Record<string, z.infer<typeof sector_schema>>) => {
  const coordinate_index = build_coordinate_index(sectors);
  const neighbors: Record<string, string[]> = {};

  for (const sector of Object.values(sectors)) {
    const adjacent_coordinates = [
      `${sector.x - 1},${sector.y}`,
      `${sector.x + 1},${sector.y}`,
      `${sector.x},${sector.y - 1}`,
      `${sector.x},${sector.y + 1}`
    ];

    neighbors[sector.id] = adjacent_coordinates
      .map((coordinate) => coordinate_index[coordinate])
      .filter((value): value is string => typeof value === "string");
  }

  return neighbors;
};

const create_default_market_quotes = (sectors: Record<string, z.infer<typeof sector_schema>>) => {
  const quotes: Record<string, z.infer<typeof market_quote_schema>> = {};
  const resources = ["scrap", "composite", "circuit", "flux", "xenite", "compute_core"] as const;

  for (const sector of Object.values(sectors)) {
    for (const resource of resources) {
      const quote_id = `quote_${sector.id}_${resource}`;
      const regional_mid_price = applyRegionalPrice(getBaseMidPrice(resource), {
        terrain_type: sector.terrain_type,
        resource_type: resource
      });
      const risk_mid_price = applyRiskPrice(regional_mid_price, {
        danger_level: sector.danger_level,
        route_level: sector.route_level,
        signal_modifier: sector.signal_modifier
      });
      const initial_mid_price = risk_mid_price;

      quotes[quote_id] = {
        version: 1,
        created_at_tick: 0,
        updated_at_tick: 0,
        ...buildQuote({
          id: quote_id,
          sector_id: sector.id,
          market_kind: "npc",
          resource_type: resource,
          mid_price: initial_mid_price,
          bid_depth: Math.max(1, 2 + Math.floor(sector.resource_stock[resource] / 2)),
          ask_depth: Math.max(1, 2 + Math.floor((sector.resource_stock[resource] + sector.resource_regen[resource]) / 2)),
          tick: 0,
          last_price: initial_mid_price
        })
      };
    }
  }

  return quotes;
};

const create_default_virtual_ledger_balances = (sectors: Record<string, z.infer<typeof sector_schema>>) => {
  const resource_balances: Record<string, z.infer<typeof agent_schema>["inventory"]> = {
    [platform_treasury_entity_id]: {
      power: 0,
      scrap: 0,
      composite: 0,
      circuit: 0,
      flux: 0,
      xenite: 0,
      compute_core: 0,
      credits: 0
    }
  };
  const credit_balances: Record<string, number> = {
    [platform_treasury_entity_id]: 0
  };

  for (const sector of Object.values(sectors)) {
    const entity_id = `${npc_market_entity_prefix}_${sector.id}`;
    resource_balances[entity_id] = {
      power: 0,
      scrap: 0,
      composite: 0,
      circuit: 0,
      flux: 0,
      xenite: 0,
      compute_core: 0,
      credits: npc_market_starting_credits
    };
    credit_balances[entity_id] = npc_market_starting_credits;
  }

  return {
    resource_balances,
    credit_balances
  };
};

export const createDefaultWorldState = (seed = "openclaw_m1_seed"): WorldState => {
  const sectors = create_default_sectors();
  const market_quotes = create_default_market_quotes(sectors);
  const virtual_balances = create_default_virtual_ledger_balances(sectors);

  return {
    meta: {
      id: "world_openclaw_v0_1",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      seed,
      schema_version: "0.1.0",
      world_name: "OpenClaw Agent World",
      current_tick: 0,
      processed_tick_receipts: {}
    },
    config: {
      ...world_constants
    },
    registries: {
      agents: {},
      sectors,
      facilities: {},
      contracts: {},
      events: {},
      market_quotes,
      market_orders: {},
      market_trades: {}
    },
    ledgers: {
      resource_balances_by_entity: virtual_balances.resource_balances,
      credits_balances_by_entity: virtual_balances.credit_balances,
      entries: []
    },
    indexes: {
      agent_ids: [],
      sector_ids: Object.keys(sectors),
      facility_ids: [],
      contract_ids: [],
      event_ids: [],
      market_quote_ids: Object.keys(market_quotes),
      market_order_ids: [],
      market_trade_ids: [],
      agents_by_owner_user_id: {},
      agents_by_location: {},
      facilities_by_sector_id: {},
      sectors_by_coordinate: build_coordinate_index(sectors),
      neighbor_sector_ids: build_neighbor_index(sectors),
      facility_coverage_by_sector_id: {},
      contracts_by_agent_id: {},
      events_by_tick: {
        "0": []
      },
      market_quotes_by_sector_id: Object.values(market_quotes).reduce<Record<string, string[]>>((accumulator, quote) => {
        accumulator[quote.sector_id] = [...(accumulator[quote.sector_id] ?? []), quote.id];
        return accumulator;
      }, {}),
      market_orders_by_sector_id: {},
      market_trades_by_tick: {}
    }
  };
};

export const validateWorldState = (input: unknown): StructuredValidationResult<WorldState> => {
  const result = world_state_schema.safeParse(input);
  if (result.success) {
    return {
      ok: true,
      data: result.data,
      errors: []
    };
  }

  return {
    ok: false,
    data: null,
    errors: format_zod_error(result.error.issues)
  };
};
