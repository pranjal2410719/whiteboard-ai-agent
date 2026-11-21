import { cookies } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { studySessions } from "@/db/schema";
import type { StudySession } from "./types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const validId = (id: unknown): id is string => typeof id === "string" && uuidPattern.test(id);
export async function workspaceId() {
  const jar = await cookies();
  const existing = jar.get("chalkly_workspace")?.value;
  if (validId(existing)) return existing;
  const id = crypto.randomUUID();
  jar.set("chalkly_workspace", id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365, secure: process.env.COOKIE_SECURE === "true" });
  return id;
}
export const ownedSession = (id: string, owner: string) => and(eq(studySessions.id, id), eq(studySessions.workspaceId, owner));
export function serialize(row: typeof studySessions.$inferSelect): StudySession {
  return { id: row.id, data: row.data, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}
export async function getSession(id: unknown, owner: string) {
  if (!validId(id)) return null;
  const match = (await db.select().from(studySessions).where(ownedSession(id, owner)).limit(1))[0];
  if (match) return match;
  // Re-associate if session exists by UUID (resolves concurrent seed race conditions across tabs/strictmode)
  const anyMatch = (await db.select().from(studySessions).where(eq(studySessions.id, id)).limit(1))[0];
  if (anyMatch) {
    try {
      await db.update(studySessions).set({ workspaceId: owner }).where(eq(studySessions.id, id));
      return { ...anyMatch, workspaceId: owner };
    } catch {
      return anyMatch;
    }
  }
  return null;
}
export const fail = (error: string, status = 400) => Response.json({ error }, { status });
