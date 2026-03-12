import type { BridgeErrorCode } from "./error-codes";
import type { bridge_capability_names, bridge_session_statuses, job_types, sync_flag_names } from "./constants";

export type BridgeCapabilityName = (typeof bridge_capability_names)[number];
export type BridgeSessionStatus = (typeof bridge_session_statuses)[number];
export type BridgeJobType = (typeof job_types)[number];
export type SyncFlagName = (typeof sync_flag_names)[number];

export type BridgeCapabilities = Record<BridgeCapabilityName, boolean>;

export type BridgeAlert = {
  code: string;
  level: "info" | "warn" | "error";
  message: string;
};

export type WorldHint = {
  protected_zone: boolean;
  current_sector_id: string | null;
  visible_sector_count: number;
  pending_event_count: number;
};

export type SyncFlags = Record<SyncFlagName, boolean>;

export type BridgeRequest<TBody = undefined, TQuery = Record<string, string | undefined>, THeaders = Record<string, string | undefined>> = {
  body: TBody;
  query?: TQuery;
  headers?: THeaders;
};

export type BridgeErrorBody = {
  ok: false;
  error_code: BridgeErrorCode;
  message: string;
};

export type BridgeSuccessBody<T> = {
  ok: true;
  data: T;
};

export type BridgeResponse<T> = {
  status: number;
  body: BridgeSuccessBody<T> | BridgeErrorBody;
  headers?: Record<string, string>;
};

export type BridgeJob = {
  job_id: string;
  job_type: BridgeJobType;
  tick: number;
  summary: string;
  payload: Record<string, string | number | boolean | null>;
};
