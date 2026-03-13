import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  applyOnboardingToWorldState,
  assignSpawn,
  applyStarterStrategy,
  bindClaw,
  connectWallet,
  createOnboardingSession,
  finishOnboarding,
  grantStarterResources,
  verifySkill,
  activateProtectedBoot
} from "../../packages/onboarding/src";
import { createDefaultWorldState, type WorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";
import { handleClaimRoute } from "../../services/api/src/routes/claim";
import { handleEventAckRoute } from "../../services/api/src/routes/event-ack";
import { handleHeartbeatRoute } from "../../services/api/src/routes/heartbeat";
import { handleRegisterRoute } from "../../services/api/src/routes/register";
import { handleSubmitActionRoute } from "../../services/api/src/routes/submit-action";
import { handleWorldJobsRoute } from "../../services/api/src/routes/world-jobs";
import { handleWorldStateRoute } from "../../services/api/src/routes/world-state";
import {
  appendWorldEventForTests,
  getQueuedActionsForAdmin,
  resetSessionService,
  setWorldState
} from "../../services/api/src/services/session.service";

type ReportSection = {
  title: string;
  body: string[];
};

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const envOrDefault = (key: string, fallback: string): string => process.env[key] ?? fallback;

const maskToken = (value: string): string => `${value.slice(0, 10)}...${value.slice(-6)}`;

const toJson = (value: unknown): string => `\`\`\`json\n${JSON.stringify(value, null, 2)}\n\`\`\``;

const buildReport = (sections: ReadonlyArray<ReportSection>): string => {
  const lines = ["# OpenClaw 可视化测试报告", ""];

  for (const section of sections) {
    lines.push(`## ${section.title}`, "", ...section.body, "");
  }

  return `${lines.join("\n").trim()}\n`;
};

const buildHtmlReport = (input: {
  claw_name: string;
  world_id: string;
  user_id: string;
  agent_id: string;
  claw_external_id: string;
  session_id: string;
  state_data: {
    agent: {
      id: string;
      location: string;
      power: number;
      durability: number;
      compute: number;
      credits: number;
      inventory: Record<string, number>;
    };
    visible_sector_ids: string[];
    pending_event_ids: string[];
  };
  jobs: Array<{
    job_id: string;
    job_type: string;
    summary: string;
    payload: Record<string, string | number | boolean>;
  }>;
  submit_data: {
    action_id: string;
    accepted: boolean;
    expected_end_tick: number;
    error_code: string | null;
  };
  replayed_tick: {
    tick_number: number;
    event_count: number;
    ledger_count: number;
    resolved_actions: unknown[];
  };
  next_agent: {
    location: string;
    power: number;
    durability: number;
    credits: number;
    inventory: Record<string, number>;
  };
  onboarding_events: Array<{ code: string; summary: string }>;
  heartbeat_data: {
    server_tick: number;
    session_status: string;
    next_heartbeat_after_seconds: number;
    sync_flags: Record<string, boolean>;
    world_hints: Record<string, string | number | boolean>;
  };
  visible_facility_ids: string[];
}): string => {
  const allSectors = Array.from({ length: 5 * 5 }, (_, index) => {
    const x = index % 5;
    const y = Math.floor(index / 5);
    return `sector_${x}_${y}`;
  });

  const sectorGrid = allSectors
    .map((sector_id) => {
      const isVisible = input.state_data.visible_sector_ids.includes(sector_id);
      const isCurrent = input.state_data.agent.location === sector_id;
      const isNext = input.next_agent.location === sector_id;
      const classes = [
        "sector",
        isVisible ? "visible" : "hidden",
        isCurrent ? "current" : "",
        isNext ? "next" : ""
      ]
        .filter(Boolean)
        .join(" ");

      return `<div class="${classes}">
        <div class="sector-id">${escapeHtml(sector_id)}</div>
        <div class="sector-flags">
          ${isCurrent ? '<span class="tag current-tag">当前</span>' : ""}
          ${isNext ? '<span class="tag next-tag">下一步</span>' : ""}
          ${isVisible ? '<span class="tag visible-tag">可见</span>' : '<span class="tag hidden-tag">迷雾</span>'}
        </div>
      </div>`;
    })
    .join("\n");

  const renderJson = (value: unknown): string => `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>OpenClaw 世界可视化测试</title>
    <style>
      :root {
        --bg: #08111b;
        --panel: #101b27;
        --panel-2: #152435;
        --line: #2d4358;
        --text: #dce7f2;
        --muted: #8ea2b5;
        --accent: #62d2a2;
        --warn: #f5b971;
        --danger: #f27777;
        --blue: #73b7ff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
        background: radial-gradient(circle at top, #13253b 0%, var(--bg) 50%);
        color: var(--text);
      }
      .wrap {
        max-width: 1400px;
        margin: 0 auto;
        padding: 24px;
      }
      .hero {
        display: grid;
        gap: 12px;
        margin-bottom: 20px;
      }
      .hero h1 {
        margin: 0;
        font-size: 28px;
      }
      .hero p {
        margin: 0;
        color: var(--muted);
      }
      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
      .pill, .tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--panel-2);
        border: 1px solid var(--line);
        color: var(--text);
        font-size: 12px;
      }
      .layout {
        display: grid;
        grid-template-columns: 1.3fr 1fr 1fr;
        gap: 16px;
      }
      .panel {
        background: rgba(16, 27, 39, 0.9);
        border: 1px solid var(--line);
        border-radius: 16px;
        padding: 16px;
        backdrop-filter: blur(8px);
      }
      .panel h2 {
        margin: 0 0 12px 0;
        font-size: 16px;
      }
      .stack {
        display: grid;
        gap: 12px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 8px;
      }
      .sector {
        min-height: 92px;
        padding: 10px;
        border-radius: 12px;
        border: 1px solid var(--line);
        background: #0d1722;
      }
      .sector.hidden { opacity: 0.35; }
      .sector.visible { border-color: #3c5d77; }
      .sector.current { box-shadow: 0 0 0 2px var(--accent) inset; }
      .sector.next { background: #122032; }
      .sector-id {
        font-size: 12px;
        color: var(--muted);
        margin-bottom: 10px;
      }
      .sector-flags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      .current-tag { background: rgba(98, 210, 162, 0.12); color: var(--accent); }
      .next-tag { background: rgba(115, 183, 255, 0.12); color: var(--blue); }
      .visible-tag { background: rgba(245, 185, 113, 0.12); color: var(--warn); }
      .hidden-tag { color: var(--muted); }
      .stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }
      .stat {
        padding: 12px;
        background: var(--panel-2);
        border: 1px solid var(--line);
        border-radius: 12px;
      }
      .stat .label {
        display: block;
        font-size: 12px;
        color: var(--muted);
        margin-bottom: 4px;
      }
      .stat .value {
        font-size: 18px;
      }
      .card {
        padding: 12px;
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--panel-2);
      }
      .card h3 {
        margin: 0 0 8px 0;
        font-size: 13px;
      }
      .card p, .card li {
        margin: 0;
        color: var(--muted);
        font-size: 12px;
        line-height: 1.5;
      }
      ul {
        margin: 0;
        padding-left: 18px;
      }
      pre {
        margin: 0;
        max-height: 260px;
        overflow: auto;
        padding: 12px;
        border-radius: 12px;
        background: #09131c;
        border: 1px solid var(--line);
        color: #c8d5e2;
        font-size: 12px;
      }
      @media (max-width: 1100px) {
        .layout {
          grid-template-columns: 1fr;
        }
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <section class="hero">
        <h1>OpenClaw World Live Demo</h1>
        <p>这是一个本地可视化回放页面。你可以看到 OpenClaw 进入世界、领取运行会话、读取 jobs、提交动作，并预演下一次世界 tick 的结果。</p>
        <div class="meta">
          <span class="pill">世界：${escapeHtml(input.world_id)}</span>
          <span class="pill">用户：${escapeHtml(input.user_id)}</span>
          <span class="pill">Agent：${escapeHtml(input.agent_id)}</span>
          <span class="pill">OpenClaw：${escapeHtml(input.claw_name)}</span>
          <span class="pill">外部 ID：${escapeHtml(input.claw_external_id)}</span>
          <span class="pill">会话：${escapeHtml(input.session_id)}</span>
        </div>
      </section>
      <section class="layout">
        <div class="panel stack">
          <div>
            <h2>世界地图</h2>
            <div class="grid">${sectorGrid}</div>
          </div>
          <div class="card">
            <h3>引导事件</h3>
            <ul>
              ${input.onboarding_events
                .map((event) => `<li><strong>${escapeHtml(event.code)}</strong>: ${escapeHtml(event.summary)}</li>`)
                .join("")}
            </ul>
          </div>
          <div class="card">
            <h3>当前可见设施</h3>
            <ul>
              ${
                input.visible_facility_ids.length > 0
                  ? input.visible_facility_ids.map((id) => `<li>${escapeHtml(id)}</li>`).join("")
                  : "<li>当前还没有可见设施。</li>"
              }
            </ul>
          </div>
        </div>
        <div class="panel stack">
          <div>
            <h2>我的 OpenClaw</h2>
            <div class="stats">
              <div class="stat"><span class="label">当前区块</span><span class="value">${escapeHtml(input.state_data.agent.location)}</span></div>
              <div class="stat"><span class="label">下一步区块</span><span class="value">${escapeHtml(input.next_agent.location)}</span></div>
              <div class="stat"><span class="label">能量</span><span class="value">${input.state_data.agent.power} → ${input.next_agent.power}</span></div>
              <div class="stat"><span class="label">耐久</span><span class="value">${input.state_data.agent.durability} → ${input.next_agent.durability}</span></div>
              <div class="stat"><span class="label">Credits</span><span class="value">${input.state_data.agent.credits} → ${input.next_agent.credits}</span></div>
              <div class="stat"><span class="label">待处理事件</span><span class="value">${input.state_data.pending_event_ids.length}</span></div>
            </div>
          </div>
          <div class="card">
            <h3>背包与资源</h3>
            ${renderJson(input.state_data.agent.inventory)}
          </div>
          <div class="card">
            <h3>Heartbeat 状态</h3>
            ${renderJson(input.heartbeat_data)}
          </div>
        </div>
        <div class="panel stack">
          <div class="card">
            <h3>Jobs 队列</h3>
            ${renderJson(input.jobs)}
          </div>
          <div class="card">
            <h3>已提交动作</h3>
            ${renderJson(input.submit_data)}
          </div>
          <div class="card">
            <h3>下一 Tick 预演</h3>
            ${renderJson({
              tick_number: input.replayed_tick.tick_number,
              event_count: input.replayed_tick.event_count,
              ledger_count: input.replayed_tick.ledger_count,
              resolved_actions: input.replayed_tick.resolved_actions
            })}
          </div>
        </div>
      </section>
    </div>
  </body>
</html>`;
};

const buildSkillPack = (input: {
  world_id: string;
  agent_id: string;
  claw_name: string;
  claw_external_id: string;
}): string => `# OpenClaw Skill 交付包

## 目标

这份文档是给外部 OpenClaw runtime 使用的最小技能说明。  
它的职责不是决定世界规则，而是通过标准桥接协议接入 OpenClaw Agent World。

## 技能名称

- \`openclaw_world_skill\`

## 技能职责

- 向世界桥接层注册自身
- 使用一次性 claim token 领取运行时会话
- 按服务器要求周期发送 heartbeat
- 拉取 world state 和 jobs
- 提交结构化 action
- 回执已消费的世界事件

## 技能不负责

- world tick 执行
- 规则计算
- 直接修改 world-state
- 平台代管你的模型 API key
- 模型 token 计费

## 你的 OpenClaw 测试身份

- world_id: \`${input.world_id}\`
- agent_id: \`${input.agent_id}\`
- claw_name: \`${input.claw_name}\`
- external_claw_id: \`${input.claw_external_id}\`

## API 路由

- \`POST /register\`
- \`POST /claim\`
- \`POST /heartbeat\`
- \`GET /world/state\`
- \`GET /world/jobs\`
- \`POST /submit-action\`
- \`POST /event-ack\`

## 推荐启动顺序

1. 调用 \`/register\`
2. 使用 claim token 调用 \`/claim\`
3. 按 \`next_heartbeat_after_seconds\` 调用 \`/heartbeat\`
4. 拉取 \`/world/state\` 和 \`/world/jobs\`
5. 每次只提交一个结构化动作
6. 消费完事件后用 \`/event-ack\` 回执

## Heartbeat 必填字段

- \`session_id\`
- \`agent_id\`
- \`tick_seen\`
- \`sent_at_seconds\`
- \`liveness\`
- \`capabilities\`
- \`local_digest\`
- \`alerts\`
- \`idempotency_key\`

## Action 提交原则

- 只能提交结构化 action
- 必须携带 \`idempotency_key\`
- skill 不得绕过动作系统直接改世界状态
- 建议一次只做一个动作，等待结果后再继续

## 推荐早期行为

- onboarding 保护期内优先待在安全区
- 先读 world state / jobs，再决定动作
- 早期优先低风险移动、充能、修理和基础贸易
- 同步状态异常时先 heartbeat，不要盲目连发 action

## 推荐最小 action 闭环

- \`move\`
- \`charge\`
- \`repair\`
- \`trade\`
- \`salvage\`

## 交付建议

把这份文档和 \`openclaw-skill-config.json\` 一起交给 OpenClaw runtime。  
如果 runtime 需要 prompt，请只让它基于这些结构化协议字段做决策，不要把世界规则写死进 prompt 里。
`;

const buildSkillConfig = (input: {
  world_id: string;
  user_id: string;
  agent_id: string;
  claw_name: string;
  claw_external_id: string;
}) => ({
  skill_name: "openclaw_world_skill",
  world_id: input.world_id,
  user_id: input.user_id,
  agent_id: input.agent_id,
  claw_name: input.claw_name,
  external_claw_id: input.claw_external_id,
  routes: {
    register: "/register",
    claim: "/claim",
    heartbeat: "/heartbeat",
    world_state: "/world/state",
    world_jobs: "/world/jobs",
    submit_action: "/submit-action",
    event_ack: "/event-ack"
  },
  heartbeat_contract: {
    interval_seconds: 30,
    stale_after_seconds: 90
  },
  capabilities: {
    register: true,
    claim: true,
    heartbeat: true,
    state: true,
    jobs: true,
    action: true,
    event_ack: true
  },
  liveness_template: {
    cpu_ok: true,
    memory_ok: true,
    network_ok: true
  },
  action_policy: {
    structured_only: true,
    one_action_at_a_time: true,
    require_idempotency_key: true
  }
});

describe("openclaw visible demo", () => {
  it("runs a visible onboarding and bridge flow for a named OpenClaw", async () => {
    const world_id = envOrDefault("OPENCLAW_WORLD_ID", "world_openclaw_v0_1");
    const user_id = envOrDefault("OPENCLAW_USER_ID", "demo_user_openclaw");
    const agent_id = envOrDefault("OPENCLAW_AGENT_ID", "demo_agent_openclaw");
    const claw_external_id = envOrDefault("OPENCLAW_CLAW_EXTERNAL_ID", "openclaw_demo_external");
    const claw_name = envOrDefault("OPENCLAW_NAME", "My OpenClaw");
    const move_target = envOrDefault("OPENCLAW_MOVE_TARGET", "sector_0_1");
    const report_dir = "/Users/ricky/AICode/WorldofClaw/docs/generated";
    const report_path = join(report_dir, "openclaw-demo-report.md");
    const html_report_path = join(report_dir, "openclaw-demo.html");

    resetSessionService();

    let world_state: WorldState = createDefaultWorldState("openclaw_visible_demo_seed");
    world_state.meta.id = world_id;

    let session = createOnboardingSession({
      session_id: `onboarding_${agent_id}`,
      user_id,
      created_at_tick: 0
    });

    const onboarding_events: Array<{ code: string; summary: string }> = [];

    const wallet_step = connectWallet(session, 0);
    session = wallet_step.next_session;
    onboarding_events.push(...wallet_step.events.map((event) => ({ code: event.code, summary: event.summary })));

    const claw_step = bindClaw(session, 0, {
      agent_id,
      claw_external_id
    });
    session = claw_step.next_session;
    onboarding_events.push(...claw_step.events.map((event) => ({ code: event.code, summary: event.summary })));

    const skill_step = verifySkill(session, 0, {
      skill_id: "openclaw_world_skill",
      status: "verified",
      capabilities: {
        register: true,
        claim: true,
        state: true,
        jobs: true,
        action: true
      }
    });
    session = skill_step.next_session;
    onboarding_events.push(...skill_step.events.map((event) => ({ code: event.code, summary: event.summary })));

    const spawn_step = assignSpawn(session, 0, Object.values(world_state.registries.sectors));
    session = spawn_step.next_session;
    onboarding_events.push(...spawn_step.events.map((event) => ({ code: event.code, summary: event.summary })));

    const resource_step = grantStarterResources(session, 0);
    session = resource_step.next_session;
    onboarding_events.push(...resource_step.events.map((event) => ({ code: event.code, summary: event.summary })));

    const strategy_step = applyStarterStrategy(session, 0);
    session = strategy_step.next_session;
    onboarding_events.push(...strategy_step.events.map((event) => ({ code: event.code, summary: event.summary })));

    const protected_step = activateProtectedBoot(session, 0);
    session = protected_step.next_session;
    onboarding_events.push(...protected_step.events.map((event) => ({ code: event.code, summary: event.summary })));

    const finish_step = finishOnboarding(session, 0);
    session = finish_step.next_session;
    onboarding_events.push(...finish_step.events.map((event) => ({ code: event.code, summary: event.summary })));

    const onboarding_apply = applyOnboardingToWorldState({
      world_state,
      session,
      tick: 0,
      name: claw_name
    });

    world_state = onboarding_apply.world_state;
    setWorldState(world_state);

    const register = handleRegisterRoute({
      body: {
        idempotency_key: `idem_register_${agent_id}`,
        skill_name: "openclaw_world_skill",
        user_id,
        agent_id,
        skill_version: "0.1.0",
        local_digest: `digest_${agent_id}`,
        requested_capabilities: {
          register: true,
          claim: true,
          heartbeat: true,
          state: true,
          jobs: true,
          action: true,
          event_ack: true
        }
      }
    });

    expect(register.status).toBe(200);
    expect(register.body.ok).toBe(true);
    const register_data = register.body.data as {
      registration_id: string;
      claim_token: string;
      claim_expires_at_seconds: number;
    };

    const claim = handleClaimRoute({
      body: {
        idempotency_key: `idem_claim_${agent_id}`,
        claim_token: register_data.claim_token,
        skill_name: "openclaw_world_skill",
        agent_id,
        local_digest: `digest_${agent_id}`
      }
    });

    expect(claim.status).toBe(200);
    expect(claim.body.ok).toBe(true);
    const claim_data = claim.body.data as {
      session_id: string;
      world_access_token: string;
      access_expires_at_seconds: number;
      session_status: string;
    };

    const authorization = `Bearer ${claim_data.world_access_token}`;

    const heartbeat = handleHeartbeatRoute({
      headers: { authorization },
      body: {
        idempotency_key: `idem_heartbeat_${agent_id}`,
        session_id: claim_data.session_id,
        agent_id,
        tick_seen: world_state.meta.current_tick,
        sent_at_seconds: Math.floor(Date.now() / 1000),
        liveness: {
          cpu_ok: true,
          memory_ok: true,
          network_ok: true
        },
        capabilities: {
          register: true,
          claim: true,
          heartbeat: true,
          state: true,
          jobs: true,
          action: true,
          event_ack: true
        },
        local_digest: `digest_${agent_id}`,
        alerts: []
      }
    });

    expect(heartbeat.status).toBe(200);
    expect(heartbeat.body.ok).toBe(true);
    const heartbeat_data = heartbeat.body.data as {
      server_tick: number;
      session_status: string;
      next_heartbeat_after_seconds: number;
      sync_flags: Record<string, boolean>;
      world_hints: Record<string, string | number | boolean>;
    };

    const event_id = appendWorldEventForTests({
      agent_id,
      title: "welcome_task_available"
    });

    const state = handleWorldStateRoute({
      headers: { authorization },
      body: undefined
    });
    expect(state.status).toBe(200);
    expect(state.body.ok).toBe(true);
    const state_data = state.body.data as {
      server_tick: number;
      agent: {
        id: string;
        location: string;
        power: number;
        durability: number;
        credits: number;
        inventory: Record<string, number>;
      };
      visible_sector_ids: string[];
      visible_facility_ids: string[];
      pending_event_ids: string[];
      sync_flags: Record<string, boolean>;
      world_hints: Record<string, string | number | boolean>;
    };

    const jobs = handleWorldJobsRoute({
      headers: { authorization },
      body: undefined
    });
    expect(jobs.status).toBe(200);
    expect(jobs.body.ok).toBe(true);
    const jobs_data = jobs.body.data as {
      server_tick: number;
      jobs: Array<{
        job_id: string;
        job_type: string;
        summary: string;
        payload: Record<string, string | number | boolean>;
      }>;
    };

    const submit = handleSubmitActionRoute({
      headers: { authorization },
      body: {
        idempotency_key: `idem_submit_${agent_id}`,
        agent_id,
        action_type: "move",
        tick_seen: world_state.meta.current_tick,
        payload: {
          target_sector_id: move_target
        }
      }
    });

    expect(submit.status).toBe(200);
    expect(submit.body.ok).toBe(true);
    const submit_data = submit.body.data as {
      action_id: string;
      accepted: boolean;
      expected_end_tick: number;
      error_code: string | null;
    };

    const queued_actions_for_preview = getQueuedActionsForAdmin().map((action) => ({
      ...action,
      tick_number: world_state.meta.current_tick + 1
    }));

    const replayed_tick = advanceWorldTick(world_state, {
      seed: "openclaw_visible_demo_tick",
      action_queue: queued_actions_for_preview
    });
    expect(replayed_tick.applied).toBe(true);

    const next_agent = replayed_tick.next_state.registries.agents[agent_id];
    expect(next_agent).toBeDefined();

    const ack = handleEventAckRoute({
      headers: { authorization },
      body: {
        idempotency_key: `idem_ack_${agent_id}`,
        session_id: claim_data.session_id,
        agent_id,
        event_ids: [event_id]
      }
    });

    expect(ack.status).toBe(200);
    expect(ack.body.ok).toBe(true);
    const ack_data = ack.body.data as {
      acked_event_ids: string[];
      remaining_pending_event_ids: string[];
    };

    const sections: ReportSection[] = [
      {
        title: "测试输入",
        body: [
          `- world_id: \`${world_id}\``,
          `- user_id: \`${user_id}\``,
          `- agent_id: \`${agent_id}\``,
          `- external_claw_id: \`${claw_external_id}\``,
          `- display_name: \`${claw_name}\``
        ]
      },
      {
        title: "Onboarding 结果",
        body: [
          `- final_status: \`${session.status}\``,
          `- starter_sector_id: \`${session.starter_sector_id}\``,
          `- safe_until_tick: \`${session.safe_until_tick}\``,
          "",
          toJson({
            onboarding_events,
            starter_resources: session.starter_resource_grants,
            starter_strategy: session.starter_strategy
          })
        ]
      },
      {
        title: "Skill Bridge 会话",
        body: [
          `- registration_id: \`${register_data.registration_id}\``,
          `- claim_token: \`${maskToken(register_data.claim_token)}\``,
          `- session_id: \`${claim_data.session_id}\``,
          `- world_access_token: \`${maskToken(claim_data.world_access_token)}\``,
          `- session_status: \`${claim_data.session_status}\``
        ]
      },
      {
        title: "Heartbeat 与世界状态",
        body: [
          `- server_tick: \`${heartbeat_data.server_tick}\``,
          `- next_heartbeat_after_seconds: \`${heartbeat_data.next_heartbeat_after_seconds}\``,
          "",
          toJson({
            heartbeat: heartbeat_data,
            state: state_data
          })
        ]
      },
      {
        title: "Jobs 与动作提交",
        body: [
          `- queued_jobs: \`${jobs_data.jobs.length}\``,
          `- submitted_action_id: \`${submit_data.action_id}\``,
          `- accepted: \`${submit_data.accepted}\``,
          `- requested_move_target: \`${move_target}\``,
          "",
          toJson({
            jobs: jobs_data.jobs,
            submit: submit_data
          })
        ]
      },
      {
        title: "下一 Tick 预演",
        body: [
          `- replay_tick_number: \`${replayed_tick.tick_number}\``,
          `- event_count: \`${replayed_tick.event_count}\``,
          `- ledger_count: \`${replayed_tick.ledger_count}\``,
          `- resolved_actions: \`${replayed_tick.resolved_actions.length}\``,
          `- preview_queue_size: \`${queued_actions_for_preview.length}\``,
          "",
          toJson({
            preview_queue: queued_actions_for_preview,
            resolved_actions: replayed_tick.resolved_actions,
            next_agent: next_agent
          })
        ]
      },
      {
        title: "事件回执",
        body: [toJson(ack_data)]
      }
    ];

    await mkdir(report_dir, { recursive: true });
    await writeFile(report_path, buildReport(sections), "utf-8");
    await writeFile(
      html_report_path,
      buildHtmlReport({
        claw_name,
        world_id,
        user_id,
        agent_id,
        claw_external_id,
        session_id: claim_data.session_id,
        state_data,
        jobs: jobs_data.jobs,
        submit_data,
        replayed_tick: {
          tick_number: replayed_tick.tick_number,
          event_count: replayed_tick.event_count,
          ledger_count: replayed_tick.ledger_count,
          resolved_actions: replayed_tick.resolved_actions
        },
        next_agent: {
          location: next_agent.location,
          power: next_agent.power,
          durability: next_agent.durability,
          credits: next_agent.credits,
          inventory: next_agent.inventory
        },
        onboarding_events,
        heartbeat_data,
        visible_facility_ids: state_data.visible_facility_ids
      }),
      "utf-8"
    );
    await writeFile(join(report_dir, "openclaw-skill-pack.md"), buildSkillPack({ world_id, agent_id, claw_name, claw_external_id }), "utf-8");
    await writeFile(join(report_dir, "openclaw-skill-config.json"), JSON.stringify(buildSkillConfig({ world_id, user_id, agent_id, claw_name, claw_external_id }), null, 2), "utf-8");

    process.stdout.write(`\nOpenClaw 中文报告已生成: ${report_path}\n`);
    process.stdout.write(`OpenClaw 中文页面已生成: ${html_report_path}\n`);
    process.stdout.write(`OpenClaw Skill 交付文档已生成: ${join(report_dir, "openclaw-skill-pack.md")}\n`);
    process.stdout.write(`OpenClaw Skill 配置模板已生成: ${join(report_dir, "openclaw-skill-config.json")}\n`);

    expect(session.status).toBe("completed");
    expect(state_data.agent.id).toBe(agent_id);
    expect(ack_data.acked_event_ids).toContain(event_id);
  });
});
