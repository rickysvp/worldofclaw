import { bridge_routes } from "../constants";
import type { BridgeRequest, BridgeResponse } from "../protocol.types";
import type { RetryPolicy } from "./retry-policy";
import { default_retry_policy, getRetryDelayMs, shouldRetry } from "./retry-policy";

export type Transport = <TRequest, TResponse>(route: string, request: BridgeRequest<TRequest>) => Promise<BridgeResponse<TResponse>>;

const sleep = async (delay_ms: number) => new Promise((resolve) => setTimeout(resolve, delay_ms));

export class BridgeClient {
  constructor(
    private readonly transport: Transport,
    private readonly retry_policy: RetryPolicy = default_retry_policy,
    private readonly access_token: string | null = null
  ) {}

  private async call<TRequest, TResponse>(route: string, request: BridgeRequest<TRequest>): Promise<BridgeResponse<TResponse>> {
    let attempt = 1;
    while (true) {
      const headers = {
        ...(request.headers ?? {}),
        ...(this.access_token ? { authorization: `Bearer ${this.access_token}` } : {})
      };
      const response = await this.transport<TRequest, TResponse>(route, { ...request, headers });
      if (!shouldRetry(response.status, attempt, this.retry_policy)) {
        return response;
      }
      await sleep(getRetryDelayMs(attempt, this.retry_policy));
      attempt += 1;
    }
  }

  register<TRequest, TResponse>(body: TRequest) {
    return this.call<TRequest, TResponse>(bridge_routes.register, { body });
  }

  claim<TRequest, TResponse>(body: TRequest) {
    return this.call<TRequest, TResponse>(bridge_routes.claim, { body });
  }

  heartbeat<TRequest, TResponse>(body: TRequest) {
    return this.call<TRequest, TResponse>(bridge_routes.heartbeat, { body });
  }

  getWorldState<TResponse>() {
    return this.call<undefined, TResponse>(bridge_routes.world_state, { body: undefined });
  }

  getWorldJobs<TResponse>() {
    return this.call<undefined, TResponse>(bridge_routes.world_jobs, { body: undefined });
  }

  submitAction<TRequest, TResponse>(body: TRequest) {
    return this.call<TRequest, TResponse>(bridge_routes.submit_action, { body });
  }

  ackEvents<TRequest, TResponse>(body: TRequest) {
    return this.call<TRequest, TResponse>(bridge_routes.event_ack, { body });
  }
}
