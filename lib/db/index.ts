import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"

import { authSchema } from "@/lib/db/schema"

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:5432/postgres"

const sql = neon(databaseUrl)

export const db = drizzle(sql, {
  schema: authSchema,
})
