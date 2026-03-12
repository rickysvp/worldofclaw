import type { Facility } from "../../../schemas/src";
import { buildInvoice } from "../settlement/invoice";
import { executeSettlement } from "../settlement/settlement-engine";

export const createChargingSettlement = (input: {
  tick: number;
  action_id: string;
  payer: string;
  facility: Facility;
  gross_amount: number;
} ) =>
  executeSettlement(
    buildInvoice({
      settlement_id: `settlement_${input.tick}_${input.action_id}`,
      tick: input.tick,
      payer: input.payer,
      payee: input.facility.id,
      owner_payee: input.facility.owner_user_id,
      gross_amount: input.gross_amount,
      reason_code: "charge_service",
      has_player_owner: input.facility.owner_user_id !== null
    })
  );
