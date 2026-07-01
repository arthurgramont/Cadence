import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsFolder = path.join(__dirname, '..', 'drizzle')

const dbUrl =
  process.env.DATABASE_URL ??
  (process.env.NODE_ENV === 'production' ? 'file:/app/storage/db.sqlite' : 'file:local.db')
const db = drizzle(dbUrl)

await migrate(db, { migrationsFolder })
process.exit(0)
