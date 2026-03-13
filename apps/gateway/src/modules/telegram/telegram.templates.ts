type DecisionRequestTemplate = {
  decisionId: string;
  decisionType: string;
  title: string;
  clawName: string;
  reason: string;
  riskLevel: string;
  recommendedOption: string;
  expiresAt: string;
  timeoutBehavior: string;
};

type DecisionResolvedTemplate = {
  decisionId: string;
  clawName: string;
  resolution: string;
  summary: string;
};

type StatusSummaryTemplate = {
  clawName: string;
  runtimeStatus: string;
  currentSector: string;
  power: number;
  durability: number;
  credits: number;
  currentAction: string;
  pendingDecisionCount: number;
  lastSeenAt: string | null;
};

export const buildLinkedSuccessMessage = (clawName: string, linkCode: string) =>
  [
    `[Claw 已接通]`,
    `claw: ${clawName}`,
    `link_code: ${linkCode}`,
    `我已经把这个 Telegram 会话记作你的主决策入口。`,
    `可用命令: /status /approve <decision_id> /reject <decision_id>`
  ].join("\n");

export const buildStatusSummaryMessage = (input: StatusSummaryTemplate) =>
  [
    `[Claw 状态汇报]`,
    `claw: ${input.clawName}`,
    `runtime: ${input.runtimeStatus}`,
    `位置: ${input.currentSector}`,
    `当前动作: ${input.currentAction}`,
    `资源: power=${input.power}, durability=${input.durability}, credits=${input.credits}`,
    `待处理决策: ${input.pendingDecisionCount}`,
    `last_seen_at: ${input.lastSeenAt ?? "never"}`
  ].join("\n");

export const buildDecisionRequestMessage = (input: DecisionRequestTemplate) =>
  [
    `[需要你的 approval]`,
    `decision_id: ${input.decisionId}`,
    `类型: ${input.decisionType}`,
    `claw: ${input.clawName}`,
    `事项: ${input.title}`,
    `原因: ${input.reason}`,
    `风险: ${input.riskLevel}`,
    `推荐: ${input.recommendedOption}`,
    `过期时间: ${input.expiresAt}`,
    `超时处理: ${input.timeoutBehavior}`,
    `/approve ${input.decisionId}`,
    `/reject ${input.decisionId}`,
    `/modify ${input.decisionId} quantity <value>`,
    `/modify ${input.decisionId} budget_cap <value>`,
    `/modify ${input.decisionId} route_risk <value>`
  ].join("\n");

export const buildDecisionResolvedMessage = (input: DecisionResolvedTemplate) =>
  [
    `[已记录你的决定]`,
    `decision_id: ${input.decisionId}`,
    `claw: ${input.clawName}`,
    `resolution: ${input.resolution}`,
    `摘要: ${input.summary}`,
    `下一步: command_outbox 已生成，等待 runtime 拉取执行`
  ].join("\n");

export const buildTimeoutNoticeMessage = (clawName: string, decisionId: string, timeoutBehavior: string) =>
  [
    `[Claw 超时回退提醒]`,
    `claw: ${clawName}`,
    `decision_id: ${decisionId}`,
    `我已经按预设策略执行超时回退。`,
    `timeout_behavior: ${timeoutBehavior}`
  ].join("\n");

export const buildRuntimeStaleNoticeMessage = (clawName: string, runtimeId: string) =>
  [
    `[Claw 心跳异常]`,
    `claw: ${clawName}`,
    `runtime_id: ${runtimeId}`,
    `我已经长时间没有上报 heartbeat，当前状态被标记为 stale。`,
    `你可以稍后发送 /status 查看是否恢复。`
  ].join("\n");
