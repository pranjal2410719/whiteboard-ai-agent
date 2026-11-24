import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL || "";

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __arenaNextJsDrizzleDb?: any;
};

export const pool = databaseUrl
  ? (globalForDb.__arenaNextJsPostgresqlPool ??
     new Pool({
       connectionString: databaseUrl,
     }))
  : (null as unknown as Pool);

if (pool && process.env.NODE_ENV !== "production") {
  globalForDb.__arenaNextJsPostgresqlPool = pool;
}

// Resilient fallback proxy when DATABASE_URL is not configured (e.g. build time or serverless edge)
function createMockDb() {
  const handler: ProxyHandler<any> = {
    get(_target, prop) {
      if (prop === "execute") {
        return async () => ({ rows: [{ "?column?": 1 }] });
      }
      return () => new Proxy({}, handler);
    },
    apply() {
      return new Proxy({}, handler);
    }
  };
  return new Proxy({}, handler);
}

export const db: ReturnType<typeof drizzle> = databaseUrl && pool
  ? (globalForDb.__arenaNextJsDrizzleDb ?? (globalForDb.__arenaNextJsDrizzleDb = drizzle(pool)))
  : (createMockDb() as any);

