export type RevenueReasonCode =
  | "npc_trade"
  | "player_trade"
  | "charge_service"
  | "repair_service"
  | "storage_service"
  | "relay_service"
  | "refinery_service";

export type SettlementPosting = {
  entity_id: string;
  credits_delta: number;
  note: string;
};

export type StructuredSettlement = {
  settlement_id: string;
  tick: number;
  payer: string;
  payee: string;
  owner_payee: string | null;
  gross_amount: number;
  platform_cut: number;
  facility_cut: number;
  tax_amount: number;
  net_amount: number;
  reason_code: RevenueReasonCode;
  postings: SettlementPosting[];
};

export type SettlementInvoice = {
  settlement_id: string;
  tick: number;
  payer: string;
  payee: string;
  owner_payee: string | null;
  gross_amount: number;
  platform_fee_bps: number;
  facility_fee_bps: number;
  tax_bps: number;
  reason_code: RevenueReasonCode;
};
