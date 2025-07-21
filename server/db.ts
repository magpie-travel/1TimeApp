import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, memories, memoryPrompts } from "@shared/schema";

// Use local PostgreSQL database
const connectionString = process.env.DATABASE_URL || 
  `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;

const sql = postgres(connectionString);
export const db = drizzle(sql);

// Export tables for easy access
export { users, memories, memoryPrompts };