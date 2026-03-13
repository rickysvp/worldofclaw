import { AdminRepository } from "./admin.repo";

export class AdminService {
  constructor(private readonly repo: AdminRepository) {}

  getRuntime(runtimeId: string) {
    return this.repo.getRuntime(runtimeId);
  }

  getDecision(decisionId: string) {
    return this.repo.getDecision(decisionId);
  }

  listDecisionActions(decisionId: string) {
    return this.repo.listDecisionActions(decisionId);
  }

  listRuntimeEvents(runtimeId: string) {
    return this.repo.listRuntimeEvents(runtimeId);
  }

  listRuntimeCommands(runtimeId: string) {
    return this.repo.listRuntimeCommands(runtimeId);
  }

  listLedgerEntries(filters: {
    ownerId?: string;
    sessionId?: string;
    decisionId?: string;
  }) {
    return this.repo.listLedgerEntries(filters);
  }
}
