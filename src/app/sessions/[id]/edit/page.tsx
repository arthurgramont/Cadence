import { db } from '@/db'
import { sessions, gear } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import { EditSessionForm } from './EditSessionForm'

/**
 * Page d'édition d'une session — Server Component.
 * Récupère la session par son id (params est une Promise en Next.js 16).
 */
export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [session, activeGear] = await Promise.all([
    db.select().from(sessions).where(eq(sessions.id, id)).limit(1).then((r) => r[0]),
    db.select().from(gear).where(eq(gear.status, 'active')),
  ])

  if (!session) notFound()

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-slate-100">Modifier la session</h1>
      <EditSessionForm
        session={session}
        gearOptions={activeGear.map((g) => ({ id: g.id, name: g.name }))}
      />
    </div>
  )
}
