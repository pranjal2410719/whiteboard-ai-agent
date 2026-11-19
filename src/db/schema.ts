import { index, jsonb, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import type { SessionData } from "@/lib/types";

export const studySessions = pgTable("chalkly_study_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  workspaceId: uuid("workspace_id").notNull(),
  data: jsonb("data").$type<SessionData>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("chalkly_session_workspace_idx").on(table.workspaceId)]);
