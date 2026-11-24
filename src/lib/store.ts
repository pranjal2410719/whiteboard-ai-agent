import { cookies } from "next/headers";
import { and, desc, eq } from "drizzle-orm";
import { db, isDatabaseConfigured, pool } from "@/db";
import { studySessions } from "@/db/schema";
import { catalog, createLesson, getStaticClassPage } from "./lessons";
import type { SessionData, StudySession } from "./types";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const validId = (id: unknown): id is string =>
  typeof id === "string" && id.trim().length > 0 && id.length <= 128;

export async function workspaceId(): Promise<string> {
  try {
    const jar = await cookies();
    const existing = jar.get("chalkly_workspace")?.value;
    if (existing && (uuidPattern.test(existing) || validId(existing))) return existing;
    const id = crypto.randomUUID();
    jar.set("chalkly_workspace", id, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      secure: process.env.COOKIE_SECURE === "true",
    });
    return id;
  } catch {
    return "00000000-0000-4000-8000-000000000001";
  }
}

export const ownedSession = (id: string, owner: string) =>
  and(eq(studySessions.id, id), eq(studySessions.workspaceId, owner));

export function serialize(row: any): StudySession {
  if (!row) {
    return {
      id: crypto.randomUUID(),
      data: createLesson("human-cell"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
  return {
    id: String(row.id),
    data: row.data,
    createdAt: typeof row.createdAt?.toISOString === "function" ? row.createdAt.toISOString() : (row.createdAt || new Date().toISOString()),
    updatedAt: typeof row.updatedAt?.toISOString === "function" ? row.updatedAt.toISOString() : (row.updatedAt || new Date().toISOString()),
  };
}

export const fail = (error: string, status = 400) => Response.json({ error }, { status });

// Resilient In-Memory Session Storage
interface MemorySession {
  id: string;
  workspaceId: string;
  data: SessionData;
  createdAt: Date;
  updatedAt: Date;
}

const globalForMemory = globalThis as typeof globalThis & {
  __chalkly_memory_sessions?: Map<string, MemorySession>;
};

if (!globalForMemory.__chalkly_memory_sessions) {
  globalForMemory.__chalkly_memory_sessions = new Map();
}

const memoryStore = globalForMemory.__chalkly_memory_sessions;

function seedMemorySessions(owner: string): MemorySession[] {
  const seeded: MemorySession[] = [];
  catalog.forEach(({ key, title, subject }, i) => {
    const lessonData = createLesson(key);
    lessonData.title = title;
    lessonData.subject = subject;
    lessonData.pages = [getStaticClassPage(key)];
    const id = `demo-${key}`;
    const item: MemorySession = {
      id,
      workspaceId: owner,
      data: lessonData,
      createdAt: new Date(Date.now() - i * 86400000),
      updatedAt: new Date(Date.now() - i * 86400000),
    };
    memoryStore.set(id, item);
    memoryStore.set(`${owner}:${id}`, item);
    seeded.push(item);
  });
  return seeded;
}

export async function listSessions(owner: string): Promise<StudySession[]> {
  const obsoleteKeys = new Set(["cell", "animal-cell", "heart-diagram", "circuit-diagram", "pythagoras", "fractions", "inclined-diagram", "water-diagram", "cell-diagram", "water-cycle", "dc-circuit", "heart", "human-heart"]);

  if (isDatabaseConfigured && pool) {
    try {
      let rows = await db
        .select()
        .from(studySessions)
        .where(eq(studySessions.workspaceId, owner))
        .orderBy(desc(studySessions.updatedAt))
        .limit(100);

      rows = rows.filter(r => {
        const lk = (r.data as any)?.lessonKey;
        const title = ((r.data as any)?.title || "").toLowerCase();
        if (obsoleteKeys.has(lk) || title.includes("animal") || title.includes("heart") || title.includes("circuit") || title.includes("inclined") || title.includes("water")) return false;
        return true;
      });

      if (!rows.length) {
        rows = await db
          .insert(studySessions)
          .values(catalog.map(({ key }, i) => ({
            workspaceId: owner,
            data: createLesson(key),
            updatedAt: new Date(Date.now() - i * 86400000),
            createdAt: new Date(Date.now() - i * 86400000),
          })))
          .returning();
      }

      if (rows && rows.length > 0) {
        return rows.map(serialize);
      }
    } catch (dbErr) {
      console.warn("Postgres query failed, falling back to in-memory store:", dbErr);
    }
  }

  // Memory fallback
  const userSessions: MemorySession[] = [];
  for (const s of memoryStore.values()) {
    if (s.workspaceId === owner) {
      userSessions.push(s);
    }
  }

  if (userSessions.length === 0) {
    return seedMemorySessions(owner).map(serialize);
  }

  return userSessions.map(serialize);
}

export async function getSession(id: unknown, owner: string): Promise<StudySession | null> {
  if (!validId(id)) return null;

  if (isDatabaseConfigured && pool) {
    try {
      const match = (await db.select().from(studySessions).where(ownedSession(id, owner)).limit(1))[0];
      if (match) return serialize(match);
      const anyMatch = (await db.select().from(studySessions).where(eq(studySessions.id, id)).limit(1))[0];
      if (anyMatch) {
        try {
          await db.update(studySessions).set({ workspaceId: owner }).where(eq(studySessions.id, id));
        } catch {}
        return serialize({ ...anyMatch, workspaceId: owner });
      }
    } catch {}
  }

  // Memory lookup
  const mem = memoryStore.get(`${owner}:${id}`) || memoryStore.get(String(id));
  if (mem) return serialize(mem);

  // Check if matches a catalog key
  const matchedCatalog = catalog.find(c => c.key === id || String(id).includes(c.key));
  if (matchedCatalog) {
    const lessonData = createLesson(matchedCatalog.key);
    lessonData.pages = [getStaticClassPage(matchedCatalog.key)];
    const newSession: MemorySession = {
      id: String(id),
      workspaceId: owner,
      data: lessonData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    memoryStore.set(String(id), newSession);
    memoryStore.set(`${owner}:${id}`, newSession);
    return serialize(newSession);
  }

  return null;
}

export async function saveSession(owner: string, data: SessionData, customId?: string): Promise<StudySession> {
  const sessionId = customId || crypto.randomUUID();
  const now = new Date();

  if (isDatabaseConfigured && pool) {
    try {
      const [row] = await db
        .insert(studySessions)
        .values({
          workspaceId: owner,
          data,
          ...(customId && uuidPattern.test(customId) ? { id: customId } : {}),
        })
        .returning();
      if (row) {
        return serialize(row);
      }
    } catch {}
  }

  const mem: MemorySession = {
    id: sessionId,
    workspaceId: owner,
    data,
    createdAt: now,
    updatedAt: now,
  };
  memoryStore.set(sessionId, mem);
  memoryStore.set(`${owner}:${sessionId}`, mem);
  return serialize(mem);
}

export async function updateSession(id: string, owner: string, data: SessionData): Promise<StudySession> {
  const now = new Date();

  if (isDatabaseConfigured && pool) {
    try {
      const [updated] = await db
        .update(studySessions)
        .set({ data, updatedAt: now })
        .where(ownedSession(id, owner))
        .returning();
      if (updated) {
        return serialize(updated);
      }
    } catch {}
  }

  const existing = memoryStore.get(`${owner}:${id}`) || memoryStore.get(id);
  const mem: MemorySession = {
    id,
    workspaceId: owner,
    data,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now,
  };
  memoryStore.set(id, mem);
  memoryStore.set(`${owner}:${id}`, mem);
  return serialize(mem);
}

export async function deleteSession(id: string, owner: string): Promise<boolean> {
  let deletedFromDb = false;
  if (isDatabaseConfigured && pool) {
    try {
      const rows = await db.delete(studySessions).where(ownedSession(id, owner)).returning();
      deletedFromDb = rows.length > 0;
    } catch {}
  }
  const deletedFromMem = memoryStore.delete(`${owner}:${id}`) || memoryStore.delete(id);
  return deletedFromDb || deletedFromMem;
}
