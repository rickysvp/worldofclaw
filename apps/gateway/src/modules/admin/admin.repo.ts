import { and, desc, eq } from "drizzle-orm";
import {
  commandOutbox,
  decisionActions,
  decisions,
  ledgerEntries,
  runtimeEvents,
  runtimes
} from "../../../../../drizzle/schema";
import type { db } from "../../db/client";

type Database = typeof db;

export class AdminRepository {
  constructor(private readonly database: Database) {}

  async getRuntime(runtimeId: string) {
    return this.database.query.runtimes.findFirst({
      where: eq(runtimes.id, runtimeId)
    });
  }

  async getDecision(decisionId: string) {
    return this.database.query.decisions.findFirst({
      where: eq(decisions.id, decisionId)
    });
  }

  async listDecisionActions(decisionId: string) {
    return this.database.query.decisionActions.findMany({
      where: eq(decisionActions.decisionId, decisionId),
      orderBy: desc(decisionActions.createdAt)
    });
  }

  async listRuntimeEvents(runtimeId: string) {
    return this.database.query.runtimeEvents.findMany({
      where: eq(runtimeEvents.runtimeId, runtimeId),
      orderBy: desc(runtimeEvents.createdAt)
    });
  }

  async listRuntimeCommands(runtimeId: string) {
    return this.database.query.commandOutbox.findMany({
      where: eq(commandOutbox.runtimeId, runtimeId),
      orderBy: desc(commandOutbox.createdAt)
    });
  }

  async listLedgerEntries(filters: {
    ownerId?: string;
    sessionId?: string;
    decisionId?: string;
  }) {
    const clauses = [];
    if (filters.ownerId) {
      clauses.push(eq(ledgerEntries.ownerId, filters.ownerId));
    }
    if (filters.sessionId) {
      clauses.push(eq(ledgerEntries.sessionId, filters.sessionId));
    }
    if (filters.decisionId) {
      clauses.push(eq(ledgerEntries.decisionId, filters.decisionId));
    }

    return this.database.query.ledgerEntries.findMany({
      where: clauses.length > 0 ? and(...clauses) : undefined,
      orderBy: desc(ledgerEntries.createdAt)
    });
  }
}
