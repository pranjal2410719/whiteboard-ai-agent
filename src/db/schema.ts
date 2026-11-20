import { index, integer, jsonb, pgTable, real, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { SessionData } from "@/lib/types";

export const studySessions = pgTable("chalkly_study_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").notNull(),
  data: jsonb("data").$type<SessionData>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("chalkly_session_workspace_idx").on(table.workspaceId)]);

export const learnerMastery = pgTable("chalkly_learner_mastery", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").notNull(),
  subjectId: text("subject_id").notNull(),
  topicId: text("topic_id").notNull(),
  conceptId: text("concept_id").notNull(),
  masteryScore: real("mastery_score").notNull().default(0.5),
  confidenceLevel: real("confidence_level").notNull().default(0.5),
  misconceptions: jsonb("misconceptions").$type<string[]>().notNull().default([]),
  attemptCount: integer("attempt_count").notNull().default(1),
  lastAssessedAt: timestamp("last_assessed_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("chalkly_mastery_workspace_idx").on(table.workspaceId),
  index("chalkly_mastery_subject_topic_idx").on(table.subjectId, table.topicId),
]);
