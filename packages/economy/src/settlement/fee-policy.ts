import {
  player_facility_service_owner_bps,
  player_facility_service_platform_bps,
  player_trade_owner_fee_bps_default,
  player_trade_platform_fee_bps,
  platform_infrastructure_service_bps
} from "../constants";
import type { RevenueReasonCode } from "../settlement.types";

export type FeePolicyInput = {
  reason_code: RevenueReasonCode;
  has_player_owner: boolean;
  owner_fee_bps?: number;
};

export type FeePolicy = {
  platform_fee_bps: number;
  facility_fee_bps: number;
};

export const getFeePolicy = (input: FeePolicyInput): FeePolicy => {
  if (input.reason_code === "player_trade") {
    return {
      platform_fee_bps: player_trade_platform_fee_bps,
      facility_fee_bps: input.has_player_owner ? (input.owner_fee_bps ?? player_trade_owner_fee_bps_default) : 0
    };
  }

  if (input.reason_code === "npc_trade") {
    return {
      platform_fee_bps: player_trade_platform_fee_bps,
      facility_fee_bps: 0
    };
  }

  if (input.has_player_owner) {
    return {
      platform_fee_bps: player_facility_service_platform_bps,
      facility_fee_bps: player_facility_service_owner_bps
    };
  }

  return {
    platform_fee_bps: platform_infrastructure_service_bps,
    facility_fee_bps: 0
  };
};
