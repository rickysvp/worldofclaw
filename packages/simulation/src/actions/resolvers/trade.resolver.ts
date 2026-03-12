import {
  applyCreditsDelta,
  canApplySettlementPostings,
  createSettlementLedgerEntries,
  executeSettlement,
  getNpcMarketEntityId,
  matchTradeAgainstQuote,
  buildInvoice
} from "../../../../economy/src";
import { cloneState } from "../../utils/clone-state";
import { decreaseCargoUsed, getRemainingCargoCapacity, increaseCargoUsed } from "../../utils/cargo";
import { appendLedgerEntry } from "../../utils/ledger-helper";
import { createOrderAndTrade, executeMarketFill, getMarketQuoteForSector } from "../../economy/market-orderbook";
import type { ActionResolver } from "../action.types";
import { addActionEvent, appendResolvedAction, failAction } from "../helpers/action-runtime";

export const tradeResolver: ActionResolver = (accumulator, context, action) => {
  const agent = accumulator.world_state.registries.agents[action.agent_id];
  if (!agent) {
    return failAction(accumulator, context, action, "agent_unavailable", "trade failed: agent unavailable");
  }

  if (!action.trade_resource_type || action.trade_amount <= 0 || action.unit_price <= 0 || !action.trade_side) {
    return failAction(accumulator, context, action, "invalid_action_payload", "trade failed: invalid trade payload");
  }

  const quote = getMarketQuoteForSector(accumulator.world_state, agent.location, action.trade_resource_type, context.tick_number, "npc");
  if (!quote) {
    return failAction(accumulator, context, action, "market_unavailable", "trade failed: market quote unavailable");
  }

  const match = matchTradeAgainstQuote({
    quote: {
      id: quote.id,
      sector_id: quote.sector_id,
      market_kind: quote.market_kind,
      resource_type: quote.resource_type,
      bid_price: quote.bid_price,
      ask_price: quote.ask_price,
      spread: quote.spread,
      bid_depth: quote.bid_depth,
      ask_depth: quote.ask_depth,
      last_price: quote.last_price,
      price_tick: quote.price_tick,
      expires_at_tick: quote.expires_at_tick
    },
    side: action.trade_side,
    requested_quantity: action.trade_amount,
    offered_unit_price: action.unit_price,
    available_credits: agent.credits,
    available_inventory: agent.inventory[action.trade_resource_type],
    available_cargo_capacity: getRemainingCargoCapacity(agent)
  });

  if (!match.ok) {
    return failAction(accumulator, context, action, match.failure_code ?? "market_unavailable", `trade failed: ${match.failure_code ?? "unknown"}`);
  }

  const before = accumulator;
  const next = {
    ...accumulator,
    world_state: cloneState(accumulator.world_state)
  };
  const next_agent = next.world_state.registries.agents[agent.id];
  if (!next_agent) {
    return failAction(before, context, action, "agent_unavailable", "trade failed: agent missing in cloned state");
  }

  const market_entity_id = quote.market_kind === "npc" ? getNpcMarketEntityId(agent.location) : `player_market_${agent.location}`;
  const invoice = buildInvoice({
    settlement_id: `settlement_${context.tick_number}_${action.id}`,
    tick: context.tick_number,
    payer: action.trade_side === "buy" ? agent.id : market_entity_id,
    payee: action.trade_side === "buy" ? market_entity_id : agent.id,
    gross_amount: match.gross_amount,
    reason_code: quote.market_kind === "npc" ? "npc_trade" : "player_trade",
    has_player_owner: false
  });
  const settlement = executeSettlement(invoice);
  if (!canApplySettlementPostings(next.world_state, settlement.postings)) {
    return failAction(before, context, action, "market_unavailable", "trade failed: settlement counterparty cannot afford payout");
  }

  for (const posting of settlement.postings) {
    applyCreditsDelta(next.world_state, posting.entity_id, posting.credits_delta);
  }

  if (action.trade_side === "sell") {
    next_agent.inventory[action.trade_resource_type] -= match.executed_quantity;
    decreaseCargoUsed(next_agent, match.executed_quantity);
  } else {
    next_agent.inventory[action.trade_resource_type] += match.executed_quantity;
    increaseCargoUsed(next_agent, match.executed_quantity);
  }
  next_agent.inventory.credits = next_agent.credits;

  let result = next;
  for (const ledger_input of createSettlementLedgerEntries(settlement, action.id, market_entity_id)) {
    result = appendLedgerEntry(result, ledger_input);
  }
  result = appendLedgerEntry(result, {
    tick: context.tick_number,
    kind: "resource_delta",
    resource_type: action.trade_resource_type,
    amount_delta: action.trade_side === "buy" ? match.executed_quantity : -match.executed_quantity,
    credits_delta: 0,
    entity_id: agent.id,
    counterparty_entity_id: market_entity_id,
    action_ref: action.id,
    note: action.trade_side === "buy" ? "trade bought resources" : "trade sold resources",
    payload: {
      executed_quantity: match.executed_quantity,
      executed_unit_price: match.executed_unit_price,
      reason_code: settlement.reason_code
    }
  });

  const { order, trade } = createOrderAndTrade({
    action_id: action.id,
    sector_id: agent.location,
    market_kind: quote.market_kind,
    side: action.trade_side,
    agent_id: agent.id,
    resource_type: action.trade_resource_type,
    quantity: match.executed_quantity,
    unit_price: match.executed_unit_price,
    tick_number: context.tick_number,
    settlement
  });
  const market_fill = executeMarketFill(result.world_state, {
    order,
    trade,
    side: action.trade_side,
    quantity: match.executed_quantity,
    unit_price: match.executed_unit_price,
    tick_number: context.tick_number
  });
  result = {
    ...result,
    world_state: market_fill.world_state
  };
  result = addActionEvent(
    result,
    context,
    action,
    "info",
    `agent ${agent.id} ${action.trade_side === "buy" ? "bought" : "sold"} ${match.executed_quantity} ${action.trade_resource_type} at ${match.executed_unit_price}`,
    "action_applied"
  );

  return appendResolvedAction(before, result, action, true, "action_applied", "trade applied", {
    executed_quantity: match.executed_quantity,
    executed_unit_price: match.executed_unit_price,
    order_id: market_fill.order.id,
    trade_id: market_fill.trade.id,
    platform_cut: settlement.platform_cut,
    facility_cut: settlement.facility_cut,
    net_amount: settlement.net_amount,
    purchased_amount: action.trade_side === "buy" ? match.executed_quantity : 0,
    sold_amount: action.trade_side === "sell" ? match.executed_quantity : 0
  });
};
