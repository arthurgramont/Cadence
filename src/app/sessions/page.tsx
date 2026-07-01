import { db } from '@/db'
import { sessions, gear } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { SessionForm } from './SessionForm'
import { deleteSessionAction } from '@/lib/actions'
import { DeleteConfirmButton } from '@/components/DeleteConfirmButton'
import { SportBadge } from '@/components/SportBadge'

export const dynamic = 'force-dynamic';

/**
 * Page Sessions — Server Component.
 * Data-fetching côté serveur + Client Components pour les formulaires interactifs.
 */
function SessionItem({ s, gearName }: { s: { id: string; sportType: string; date: string; distance: number; duration: number; rpe: number; calculatedLoad: number; gearId: string | null }; gearName: string | undefined }) {
  return (
    <div className="bg-slate-900 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <SportBadge sport={s.sportType} />
        <span className="text-sm tabular-nums text-slate-400 shrink-0">{s.date}</span>
        <span className="text-sm font-medium text-slate-200 shrink-0">{s.distance} km</span>
        <span className="text-sm text-slate-500 shrink-0">{Math.round(s.duration / 60)} min</span>
        {gearName && <span className="text-xs text-slate-500 hidden md:block truncate">{gearName}</span>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className="text-xs text-slate-500 hidden sm:block">RPE {s.rpe}</span>
        <span className="text-sm font-semibold text-amber-400 tabular-nums">{s.calculatedLoad} UA</span>
        <Link href={`/sessions/${s.id}/edit`} className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded hover:bg-slate-800">
          Éditer
        </Link>
        <form action={deleteSessionAction}>
          <input type="hidden" name="id" value={s.id} />
          <DeleteConfirmButton message={`Supprimer la session du ${s.date} ?`} />
        </form>
      </div>
    </div>
  )
}

export default async function SessionsPage() {
  const [allSessions, activeGear] = await Promise.all([
    db.select().from(sessions).orderBy(desc(sessions.date)),
    db.select().from(gear).where(eq(gear.status, 'active')),
  ])

  const gearIndex = Object.fromEntries(activeGear.map((g) => [g.id, g.name]))

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-slate-100">Sessions</h1>
      <SessionForm gearOptions={activeGear.map((g) => ({ id: g.id, name: g.name }))} />
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Toutes les sessions ({allSessions.length})
        </h2>
        {allSessions.length === 0 ? (
          <p className="text-slate-500 text-sm bg-slate-900 rounded-xl px-4 py-5">Aucune session pour l&apos;instant.</p>
        ) : (
          <div className="space-y-2">
            {allSessions.map((s) => (
              <SessionItem key={s.id} s={s} gearName={s.gearId ? gearIndex[s.gearId] : undefined} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

