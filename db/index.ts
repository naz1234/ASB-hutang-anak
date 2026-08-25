import { drizzle } from "drizzle-orm/d1";

export function getDb(): ReturnType<typeof drizzle> {
  throw new Error("D1 is not configured. Tracker persistence uses the TRACKER Durable Object binding.");
}
