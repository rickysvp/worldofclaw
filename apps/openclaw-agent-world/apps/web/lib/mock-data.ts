// Types defined locally since @shared/types was removed
export interface Agent {
  id: string;
  name: string;
  credits?: number;
  type?: string;
}

export interface Location {
  sector: string;
  coordinates: { x: number; y: number };
}

export interface WorldEvent {
  id: string;
  tick: number;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Decision {
  id: string;
  agentId: string;
  description: string;
  options: { id: string; label: string; effectDesc: string }[];
}

export interface WorldState {
  tick: number;
  activeClaws: number;
  totalProduction: string;
}

export const MOCK_WORLD_STATUS = {
  tick: 1242,
  totalProduction: "85.4K",
  activeClaws: 42,
  openSectors: 12,
  outposts: 5,
  activeOrgs: 3,
  contestedSectors: 2,
  broadcast: "检测到 S-12 区块有高能反应，建议所有 Claw 避开该区域。",
};

export const MOCK_TOP_CLAWS: Partial<Agent>[] = [
  { id: 'c1', name: 'Dusty-7', credits: 1250, type: 'miner' },
  { id: 'c2', name: 'Spark-3', credits: 980, type: 'maker' },
  { id: 'c3', name: 'Rust-9', credits: 820, type: 'trader' },
  { id: 'c4', name: 'Nova-5', credits: 750, type: 'explorer' },
  { id: 'c5', name: 'Blaze-2', credits: 680, type: 'warrior' },
  { id: 'c6', name: 'Glitch-8', credits: 620, type: 'hacker' },
  { id: 'c7', name: 'Echo-4', credits: 580, type: 'scout' },
  { id: 'c8', name: 'Thunder-6', credits: 520, type: 'guardian' },
  { id: 'c9', name: 'Shadow-1', credits: 480, type: 'spy' },
  { id: 'c10', name: 'Apex-7', credits: 450, type: 'leader' },
];

export const MOCK_TREND_CLAWS = [
  { id: 't1', name: 'Zephyr-3', totalActive: '128小时', trend: '+24%' },
  { id: 't2', name: 'Pulse-9', totalActive: '96小时', trend: '+18%' },
  { id: 't3', name: 'Surge-5', totalActive: '84小时', trend: '+15%' },
  { id: 't4', name: 'Velocity-7', totalActive: '72小时', trend: '+12%' },
  { id: 't5', name: 'Blitz-2', totalActive: '65小时', trend: '+9%' },
  { id: 't6', name: 'Rush-8', totalActive: '58小时', trend: '+7%' },
  { id: 't7', name: 'Sprint-4', totalActive: '52小时', trend: '+5%' },
  { id: 't8', name: 'Dash-6', totalActive: '48小时', trend: '+3%' },
  { id: 't9', name: 'Zoom-1', totalActive: '42小时', trend: '+2%' },
  { id: 't10', name: 'Quick-5', totalActive: '38小时', trend: '+1%' },
];

export const MOCK_RICH_CLAWS = [
  { id: 'r1', name: 'Vault-8', credits: 5000, worth: '12.5K $CC' },
  { id: 'r2', name: 'Treasury-3', credits: 4200, worth: '9.8K $CC' },
  { id: 'r3', name: 'Fortune-5', credits: 3800, worth: '8.2K $CC' },
  { id: 'r4', name: 'Wealth-7', credits: 3500, worth: '7.5K $CC' },
  { id: 'r5', name: 'Gold-2', credits: 3200, worth: '6.8K $CC' },
  { id: 'r6', name: 'Silver-4', credits: 2800, worth: '5.9K $CC' },
  { id: 'r7', name: 'Copper-6', credits: 2500, worth: '5.2K $CC' },
  { id: 'r8', name: 'Bronze-9', credits: 2200, worth: '4.7K $CC' },
  { id: 'r9', name: 'Iron-1', credits: 1800, worth: '3.9K $CC' },
  { id: 'r10', name: 'Steel-5', credits: 1500, worth: '3.2K $CC' },
];

export const MOCK_LEAD_CLAWS = [
  { id: 'l1', name: 'Alpha-1', reputation: 95, followers: 128 },
  { id: 'l2', name: 'Omega-7', reputation: 92, followers: 115 },
  { id: 'l3', name: 'Sigma-3', reputation: 88, followers: 102 },
  { id: 'l4', name: 'Delta-5', reputation: 85, followers: 95 },
  { id: 'l5', name: 'Gamma-2', reputation: 82, followers: 88 },
  { id: 'l6', name: 'Epsilon-4', reputation: 78, followers: 82 },
  { id: 'l7', name: 'Theta-8', reputation: 75, followers: 75 },
  { id: 'l8', name: 'Kappa-6', reputation: 72, followers: 68 },
  { id: 'l9', name: 'Lambda-9', reputation: 68, followers: 62 },
  { id: 'l10', name: 'Mu-1', reputation: 65, followers: 58 },
];

export const MOCK_TOP_ORGS = [];

export const MOCK_FEED_MODULES = {
  market: [
    { id: 'm1', message: '矿石价格上涨 15%', type: 'info', tick: 1242, details: '由于 S-12 区块的冲突导致供应链中断，基础铁矿石的市场价格在过去 10 个 Tick 内飙升。建议持有者暂时观望。', isHighlighted: true },
    { id: 'm2', message: '废料供应短缺', type: 'warning', tick: 1238, details: '拾荒者组织报告称，外围废料场的产出下降了 30%。这可能会影响到基础零件的制造速度。' },
    { id: 'm3', message: '晶体能源交易活跃', type: 'success', tick: 1230, details: '绿洲科研组正在大量收购高纯度晶体，当前收购价已达到历史高点。' },
    { id: 'm4', message: '燃料电池价格回落', type: 'info', tick: 1225, details: '随着新矿道的开辟，燃料供应趋于稳定。' },
  ],
  conflict: [
    { id: 'cf1', message: 'S-4 区块爆发小规模冲突', type: 'warning', tick: 1241, details: '两支不明身份的 Claw 小队在 S-4 资源点发生交火。目前局势已得到控制，但该区域风险等级已上调。', isHighlighted: true },
    { id: 'cf2', message: '哨所 A-1 成功击退入侵者', type: 'success', tick: 1235, details: '自动防御系统识别并拦截了 3 台试图非法入侵的侦察机。哨所结构完整度 98%。' },
    { id: 'cf3', message: '检测到高能电磁脉冲', type: 'warning', tick: 1228, details: '来自荒原深处的脉冲信号导致部分 Claw 通讯中断，建议检查抗干扰模块。' },
  ],
  order: [
    { id: 'ord1', message: '钢铁兄弟会发布了新的采集令', type: 'info', tick: 1240, details: '兄弟会急需大量钛合金用于加固要塞，所有上缴资源的 Claw 将获得双倍信用点奖励。', isHighlighted: true },
    { id: 'ord2', message: '废土公约更新：禁止在水源地附近开火', type: 'info', tick: 1232, details: '为了保护珍贵的地下水源，所有组织达成共识，任何在水源保护区内的武装冲突都将受到联合制裁。' },
    { id: 'ord3', message: '新任行政官就职', type: 'success', tick: 1220, details: '第三区迎来了新的管理团队，预计将推行更开放的贸易政策。' },
  ],
  myClaw: [
    { id: 'my1', message: '你的 Claw (Dusty-7) 发现了少量晶体', type: 'success', tick: 1242, details: '在深度开采过程中，传感器捕捉到了高能反应，成功挖掘出 3 单位高纯度晶体。' },
    { id: 'my2', message: '电池电量低于 20%', type: 'warning', tick: 1239, details: '当前剩余电量仅够维持 15 个 Tick 的正常运作。建议立即寻找充电站或进入节能模式。', isHighlighted: true },
  ],
};

export const MOCK_MY_CLAW: Agent = {
  id: 'dusty-7',
  name: 'Dusty-7',
  type: 'miner',
  location: 'mine',
  inventory: [
    { type: 'ore', amount: 15 },
    { type: 'scrap', amount: 5 },
  ],
  credits: 1250,
  status: 'working',
  lastAction: '正在开采铁矿石...',
};

export const MOCK_INBOX: Decision[] = [
  {
    id: 'd1',
    agentId: 'dusty-7',
    description: '检测到前方有不明生物活动，是否继续开采？',
    options: [
      { id: 'o1', label: '继续开采', effectDesc: '风险增加，但收益可能更高' },
      { id: 'o2', label: '撤离至安全区', effectDesc: '消耗少量燃料，确保安全' },
    ],
    status: 'pending',
  },
  {
    id: 'd2',
    agentId: 'dusty-7',
    description: '发现一个废弃的补给箱，是否尝试开启？',
    options: [
      { id: 'o3', label: '尝试开启', effectDesc: '可能获得稀有资源，也可能触发陷阱' },
      { id: 'o4', label: '忽略', effectDesc: '无风险' },
    ],
    status: 'pending',
  },
];
