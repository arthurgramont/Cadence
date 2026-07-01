export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { migrate } = await import('drizzle-orm/libsql/migrator')
    const { db } = await import('./db/index')
    await migrate(db, { migrationsFolder: './drizzle' })
  }
}
