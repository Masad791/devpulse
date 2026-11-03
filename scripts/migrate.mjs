// Applies db/schema.sql. Usage: npm run db:migrate (reads DATABASE_URL from .env.local).
import { readFile } from "node:fs/promises";
import postgres from "postgres";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set (copy .env.example to .env.local).");
  process.exit(1);
}
const sql = postgres(process.env.DATABASE_URL, { onnotice: () => {} });
await sql.unsafe(await readFile(new URL("../db/schema.sql", import.meta.url), "utf8"));
await sql.end();
console.log("Schema is up to date.");
