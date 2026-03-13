export type ResourceType = 'ore' | 'scrap' | 'crystal';
export type AgentType = 'miner' | 'maker' | 'trader';
export type LocationId = 'mine' | 'trading_post' | 'ruins_camp';

export interface ResourceStack {
  type: ResourceType;
  amount: number;
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  location: LocationId;
  inventory: ResourceStack[];
  credits: number;
  status: 'idle' | 'working' | 'traveling' | 'resting';
  lastAction?: string;
}

export interface Location {
  id: LocationId;
  name: string;
  description: string;
  resources: ResourceStack[];
}

export interface WorldEvent {
  id: string;
  tick: number;
  message: string;
  type: 'info' | 'warning' | 'success';
}

export interface Decision {
  id: string;
  agentId: string;
  description: string;
  options: {
    id: string;
    label: string;
    effectDesc: string;
  }[];
  status: 'pending' | 'resolved';
}

export interface WorldState {
  tick: number;
  agents: Agent[];
  locations: Location[];
  events: WorldEvent[];
  decisions: Decision[];
  config: {
    tickIntervalMs: number;
    resourcePrices: Record<ResourceType, number>;
  };
}
