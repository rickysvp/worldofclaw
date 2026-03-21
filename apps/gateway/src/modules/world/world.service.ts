import { WorldRepository } from "./world.repo";

export interface WorldStatus {
  tick: number;
  totalProduction: string;
  activeClaws: number;
  openSectors: number;
  activeOrgs: number;
  contestedSectors: number;
  broadcast: string;
}

export interface RuntimeSummary {
  id: string;
  claw_name: string;
  credits: number;
  current_sector: string;
  last_heartbeat: string | null;
  status: string;
}

export interface WorldEvent {
  id: string;
  tick: number;
  type: string;
  message: string;
  severity: string;
}

export class WorldService {
  constructor(private readonly repo: WorldRepository) {}

  async getStatus(): Promise<WorldStatus> {
    try {
      return await this.repo.getWorldStatus();
    } catch {
      // Fallback mock data if DB query fails
      return {
        tick: 1242,
        totalProduction: "85.4K",
        activeClaws: 42,
        openSectors: 25,
        activeOrgs: 3,
        contestedSectors: 2,
        broadcast: "检测到 S-12 区块有高能反应，建议所有 Claw 避开该区域。"
      };
    }
  }

  async getRuntimes(): Promise<RuntimeSummary[]> {
    try {
      return await this.repo.getRuntimes();
    } catch {
      return [];
    }
  }

  async getEvents(limit = 50): Promise<WorldEvent[]> {
    try {
      return await this.repo.getEvents(limit);
    } catch {
      return [];
    }
  }
}
