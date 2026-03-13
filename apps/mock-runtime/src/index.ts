import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type RuntimeState = {
  baseUrl: string;
  runtime_id: string;
  session_id: string;
  auth_token: string;
  telegram_link_code: string;
  last_command?: RuntimeCommandState;
};

type RuntimeCommandState = {
    command_id: string;
    correlation_id?: string;
    decision_id?: string | null;
};

type CommandRecord = {
  command_id: string;
  command_type: string;
  payload: Record<string, unknown>;
  decision_id: string | null;
  created_at: string;
};

const stateFilePath = process.env.MOCK_RUNTIME_STATE_FILE
  ? resolve(process.env.MOCK_RUNTIME_STATE_FILE)
  : resolve(process.cwd(), "apps/mock-runtime/.mock-runtime-state.json");
const defaultBaseUrl = process.env.MOCK_RUNTIME_BASE_URL ?? "http://localhost:4000";

const ensureStateDir = async () => {
  await mkdir(dirname(stateFilePath), { recursive: true });
};

const loadState = async (): Promise<RuntimeState | null> => {
  try {
    const raw = await readFile(stateFilePath, "utf8");
    return JSON.parse(raw) as RuntimeState;
  } catch {
    return null;
  }
};

const saveState = async (state: RuntimeState): Promise<void> => {
  await ensureStateDir();
  await writeFile(stateFilePath, JSON.stringify(state, null, 2));
};

const request = async <T>(
  path: string,
  input: {
    method?: "GET" | "POST";
    token?: string;
    body?: unknown;
  } = {}
): Promise<T> => {
  const init: RequestInit = {
    method: input.method ?? "GET",
    headers: {
      "content-type": "application/json",
      ...(input.token ? { "x-runtime-auth-token": input.token } : {})
    }
  };
  if (input.body !== undefined) {
    init.body = JSON.stringify(input.body);
  }

  const response = await fetch(`${defaultBaseUrl}${path}`, init);

  const payload = (await response.json()) as T;
  if (!response.ok) {
    throw new Error(JSON.stringify(payload));
  }

  return payload;
};

export const register = async () => {
  const payload = await request<RuntimeState & { heartbeat_interval_seconds: number }>("/api/runtime/register", {
    method: "POST",
    body: {
      runtime_name: "mock-runtime",
      claw_name: "Ash Claw",
      user_ref: "mock-user-01",
      runtime_version: "0.3.0"
    }
  });

  const state: RuntimeState = {
    baseUrl: defaultBaseUrl,
    runtime_id: payload.runtime_id,
    session_id: payload.session_id,
    auth_token: payload.auth_token,
    telegram_link_code: payload.telegram_link_code
  };

  await saveState(state);

  console.log("registered");
  console.log(JSON.stringify(state, null, 2));
  console.log(`telegram link with: /link ${payload.telegram_link_code}`);
};

export const requireState = async () => {
  const state = await loadState();
  if (!state) {
    throw new Error("state file missing, run register first");
  }
  return state;
};

export const heartbeat = async () => {
  const state = await requireState();
  const payload = await request<{
    accepted: boolean;
    next_poll_after: number;
    pending_command_count: number;
  }>("/api/runtime/heartbeat", {
    method: "POST",
    token: state.auth_token,
    body: {
      runtime_id: state.runtime_id,
      session_id: state.session_id,
      power: 91,
      durability: 84,
      credits: 640,
      current_action: "holding_for_order",
      current_sector: "night_wharf",
      summary: {
        cargo_used: 2,
        cargo_max: 6
      },
      current_tick: 1442
    }
  });

  console.log(JSON.stringify(payload, null, 2));
};

export const createDecision = async () => {
  const state = await requireState();
  const payload = await request<{ decision_id: string; status: string }>("/api/runtime/events/decision-needed", {
    method: "POST",
    token: state.auth_token,
    body: {
      runtime_id: state.runtime_id,
      session_id: state.session_id,
      decision_type: "high_value_trade",
      title: "Night Wharf xenite trade",
      reason: "Counterparty requests a high-risk xenite purchase above the local auto-trade threshold.",
      risk_level: "high",
      recommended_option: "reject",
      options: [
        { id: "approve", label: "Approve trade" },
        { id: "reject", label: "Reject trade" }
      ],
      snapshot: {
        world_tick: 1442,
        trade: {
          counterparty: "night_wharf_market",
          estimated_spend: 520
        }
      },
      correlation_id: `mock-decision-${Date.now()}`,
      expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }
  });

  console.log(JSON.stringify(payload, null, 2));
  console.log("approve in Telegram with:");
  console.log(`/approve ${payload.decision_id}`);
};

export const poll = async (markDelivered: boolean) => {
  const state = await requireState();
  const payload = await request<{ commands: CommandRecord[] }>(
    `/api/runtime/commands/poll?runtime_id=${state.runtime_id}&session_id=${state.session_id}&mark_delivered=${String(markDelivered)}`,
    {
      token: state.auth_token
    }
  );

  const command = payload.commands[0];
  if (command) {
    const lastCommand: RuntimeCommandState = {
      command_id: command.command_id,
      decision_id: command.decision_id
    };
    if (typeof command.payload.correlation_id === "string") {
      lastCommand.correlation_id = command.payload.correlation_id;
    }
    state.last_command = lastCommand;
    await saveState(state);
  }

  console.log(JSON.stringify(payload, null, 2));
};

export const ackResult = async () => {
  const state = await requireState();
  const correlationId = state.last_command?.correlation_id;
  if (!correlationId) {
    throw new Error("no last command correlation_id found, run poll first");
  }

  const payload = await request<{ accepted: boolean; idempotent?: boolean }>("/api/runtime/events/action-result", {
    method: "POST",
    token: state.auth_token,
    body: {
      runtime_id: state.runtime_id,
      session_id: state.session_id,
      action_type: "approval_resume",
      correlation_id: correlationId,
      result: {
        status: "success",
        summary: "Runtime resumed trade recovery path after Telegram decision."
      },
      rewards: [
        {
          resource_type: "intel",
          quantity: 1,
          unit: "unit"
        }
      ],
      losses: [
        {
          resource_type: "power",
          quantity: 2,
          unit: "unit"
        }
      ],
      next_state_summary: {
        current_action: "trade_resolution_applied",
        current_sector: "night_wharf"
      },
      world_tick: 1443
    }
  });

  console.log(JSON.stringify(payload, null, 2));
};

export const demoFlow = async () => {
  let state = await loadState();
  if (!state) {
    await register();
    state = await requireState();
  }

  await heartbeat();
  await createDecision();

  console.log(`Telegram 绑定命令: /link ${state.telegram_link_code}`);
  console.log("完成 Telegram approve/reject/modify 后，我会尝试拉取命令。");

  for (let attempt = 0; attempt < 10; attempt += 1) {
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 3_000));
    const response = await request<{ commands: CommandRecord[] }>(
      `/api/runtime/commands/poll?runtime_id=${state.runtime_id}&session_id=${state.session_id}&mark_delivered=true`,
      {
        token: state.auth_token
      }
    );

    if (response.commands.length === 0) {
      console.log(`poll attempt ${attempt + 1}: no command yet`);
      continue;
    }

    const command = response.commands[0];
    if (!command) {
      continue;
    }

    const lastCommand: RuntimeCommandState = {
      command_id: command.command_id,
      decision_id: command.decision_id
    };
    if (typeof command.payload.correlation_id === "string") {
      lastCommand.correlation_id = command.payload.correlation_id;
    }
    state.last_command = lastCommand;
    await saveState(state);

    console.log("command received");
    console.log(JSON.stringify(command, null, 2));

    await ackResult();
    console.log("demo flow complete");
    return;
  }

  console.log("demo flow waiting for Telegram resolution timed out");
};

export const main = async (): Promise<void> => {
  const command = process.argv[2] ?? "demo-flow";

  switch (command) {
    case "register":
      await register();
      return;
    case "heartbeat":
      await heartbeat();
      return;
    case "create-decision":
      await createDecision();
      return;
    case "poll":
      await poll(process.argv.includes("--mark-delivered"));
      return;
    case "ack-result":
      await ackResult();
      return;
    case "demo-flow":
      await demoFlow();
      return;
    default:
      throw new Error(`unknown command: ${command}`);
  }
};

const isDirectExecution = process.argv[1] === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
