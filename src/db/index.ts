import { drizzle } from 'drizzle-orm/libsql'

const dbUrl =
  process.env.DATABASE_URL ??
  (process.env.NODE_ENV === 'production' ? 'file:/app/storage/db.sqlite' : 'file:local.db')
export const db = drizzle(dbUrl)
