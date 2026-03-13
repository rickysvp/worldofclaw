import { relations } from "drizzle-orm";
import {
  commandOutbox,
  decisionActions,
  decisions,
  runtimeEvents,
  runtimeHeartbeats,
  runtimes,
  runtimeSessions,
  telegramLinks,
  users
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  telegramLinks: many(telegramLinks),
  runtimes: many(runtimes)
}));

export const telegramLinksRelations = relations(telegramLinks, ({ one }) => ({
  user: one(users, {
    fields: [telegramLinks.userId],
    references: [users.id]
  })
}));

export const runtimesRelations = relations(runtimes, ({ one, many }) => ({
  user: one(users, {
    fields: [runtimes.userId],
    references: [users.id]
  }),
  sessions: many(runtimeSessions),
  heartbeats: many(runtimeHeartbeats),
  events: many(runtimeEvents),
  decisions: many(decisions),
  commands: many(commandOutbox)
}));

export const runtimeSessionsRelations = relations(runtimeSessions, ({ one, many }) => ({
  runtime: one(runtimes, {
    fields: [runtimeSessions.runtimeId],
    references: [runtimes.id]
  }),
  heartbeats: many(runtimeHeartbeats),
  events: many(runtimeEvents),
  decisions: many(decisions)
}));

export const runtimeHeartbeatsRelations = relations(runtimeHeartbeats, ({ one }) => ({
  runtime: one(runtimes, {
    fields: [runtimeHeartbeats.runtimeId],
    references: [runtimes.id]
  }),
  session: one(runtimeSessions, {
    fields: [runtimeHeartbeats.sessionId],
    references: [runtimeSessions.id]
  })
}));

export const runtimeEventsRelations = relations(runtimeEvents, ({ one }) => ({
  runtime: one(runtimes, {
    fields: [runtimeEvents.runtimeId],
    references: [runtimes.id]
  }),
  session: one(runtimeSessions, {
    fields: [runtimeEvents.sessionId],
    references: [runtimeSessions.id]
  })
}));

export const decisionsRelations = relations(decisions, ({ one, many }) => ({
  runtime: one(runtimes, {
    fields: [decisions.runtimeId],
    references: [runtimes.id]
  }),
  session: one(runtimeSessions, {
    fields: [decisions.sessionId],
    references: [runtimeSessions.id]
  }),
  actions: many(decisionActions),
  commands: many(commandOutbox)
}));

export const decisionActionsRelations = relations(decisionActions, ({ one }) => ({
  decision: one(decisions, {
    fields: [decisionActions.decisionId],
    references: [decisions.id]
  })
}));

export const commandOutboxRelations = relations(commandOutbox, ({ one }) => ({
  runtime: one(runtimes, {
    fields: [commandOutbox.runtimeId],
    references: [runtimes.id]
  }),
  decision: one(decisions, {
    fields: [commandOutbox.decisionId],
    references: [decisions.id]
  })
}));
