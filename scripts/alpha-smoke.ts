import "dotenv/config";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

type SmokeResult = {
  name: string;
  ok: boolean;
  detail: string;
};

const gatewayBaseUrl = (process.env.ALPHA_SMOKE_BASE_URL ?? process.env.APP_BASE_URL ?? "http://localhost:4000").replace(
  /\/$/,
  ""
);
const viewerUserRef = process.env.ALPHA_SMOKE_USER_REF ?? process.env.NEXT_PUBLIC_DEFAULT_USER_REF ?? "alpha_demo_user";

const readJson = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${gatewayBaseUrl}${path}`);
  const payload = (await response.json()) as T | { error?: string };
  if (!response.ok) {
    const errorMessage =
      typeof payload === "object" && payload !== null && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }
  return payload as T;
};

const run = async () => {
  const results: SmokeResult[] = [];

  const push = (name: string, ok: boolean, detail: string) => {
    results.push({ name, ok, detail });
  };

  try {
    const payload = await readJson<{ ok: boolean; service: string }>("/health");
    push("gateway 存活", payload.ok === true, `${payload.service}`);
  } catch (error) {
    push("gateway 存活", false, error instanceof Error ? error.message : "unknown health error");
  }

  try {
    const payload = await readJson<{ data: Array<{ id: string }> }>("/api/public/world-feed");
    push("前端能读到 world-feed", payload.data.length > 0, `items=${payload.data.length}`);
  } catch (error) {
    push("前端能读到 world-feed", false, error instanceof Error ? error.message : "unknown world-feed error");
  }

  try {
    const payload = await readJson<{ data: { claw_name: string } | null }>(
      `/api/me/claw-summary?user_ref=${encodeURIComponent(viewerUserRef)}`
    );
    push("front-end 能读到 claw-summary", payload.data !== null, payload.data?.claw_name ?? "no claw summary");
  } catch (error) {
    push("front-end 能读到 claw-summary", false, error instanceof Error ? error.message : "unknown claw-summary error");
  }

  const telegramEnvOk = Boolean(process.env.TELEGRAM_BOT_TOKEN) && Boolean(process.env.TELEGRAM_WEBHOOK_SECRET);
  push(
    "Telegram 相关 env 存在",
    telegramEnvOk,
    telegramEnvOk ? "TELEGRAM_BOT_TOKEN + TELEGRAM_WEBHOOK_SECRET present" : "missing Telegram env"
  );

  await mkdir(join(process.cwd(), ".tmp"), { recursive: true });
  const demoFlowStatePath = join(process.cwd(), ".tmp", "alpha-smoke-runtime.json");
  const demoFlow = spawnSync("pnpm", ["dev:mock-runtime", "--", "demo-flow"], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: {
      ...process.env,
      MOCK_RUNTIME_BASE_URL: gatewayBaseUrl,
      MOCK_RUNTIME_STATE_FILE: demoFlowStatePath,
      MOCK_RUNTIME_DEMO_FLOW_POLL_ATTEMPTS: "1",
      MOCK_RUNTIME_DEMO_FLOW_POLL_INTERVAL_MS: "100"
    }
  });
  push(
    "mock-runtime 可跑 demo-flow",
    demoFlow.status === 0,
    demoFlow.status === 0
      ? "demo-flow entrypoint executed"
      : demoFlow.stderr.trim() || demoFlow.stdout.trim() || "demo-flow failed"
  );

  try {
    const payload = await readJson<{ data: Array<{ decision_id: string; risk_level: string }> }>(
      `/api/me/pending-decisions?user_ref=${encodeURIComponent(viewerUserRef)}`
    );
    const highRiskDecision = payload.data.find((decision) => decision.risk_level === "high");
    push(
      "至少一个高风险 decision 可被查询到",
      Boolean(highRiskDecision),
      highRiskDecision?.decision_id ?? "no high-risk pending decision"
    );
  } catch (error) {
    push("至少一个高风险 decision 可被查询到", false, error instanceof Error ? error.message : "decision query failed");
  }

  try {
    const payload = await readJson<{ data: { recent_entries: Array<{ id: string }> } }>(
      `/api/me/ledger-summary?user_ref=${encodeURIComponent(viewerUserRef)}`
    );
    push(
      "至少一条 ledger summary 可被查询到",
      payload.data.recent_entries.length > 0,
      `entries=${payload.data.recent_entries.length}`
    );
  } catch (error) {
    push("至少一条 ledger summary 可被查询到", false, error instanceof Error ? error.message : "ledger query failed");
  }

  const failed = results.filter((result) => !result.ok);
  for (const result of results) {
    const mark = result.ok ? "PASS" : "FAIL";
    console.log(`[${mark}] ${result.name} :: ${result.detail}`);
  }

  if (failed.length > 0) {
    process.exitCode = 1;
  }
};

run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
