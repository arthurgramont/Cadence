import { drizzle } from 'drizzle-orm/libsql'

const dbUrl = process.env.DATABASE_URL ?? 'file:local.db'
export const db = drizzle(dbUrl)
