import { db } from '@/db'
import { sessions, gear } from '@/db/schema'
import { desc, eq } from 'drizzle-orm'
import Link from 'next/link'
import { SessionForm } from './SessionForm'
import { deleteSessionAction } from '@/lib/actions'
import { DeleteConfirmButton } from '@/components/DeleteConfirmButton'

/**
 * Page Sessions — Server Component.
 * Data-fetching côté serveur + Client Components pour les formulaires interactifs.
 */
export default async function SessionsPage() {
  const [allSessions, activeGear] = await Promise.all([
    db.select().from(sessions).orderBy(desc(sessions.date)),
    db.select().from(gear).where(eq(gear.status, 'active')),
  ])

  // Index du matériel pour affichage dans la liste sans N+1 requêtes
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
          <p className="text-slate-500 text-sm bg-slate-900 rounded-xl px-4 py-5">
            Aucune session pour l&apos;instant.
          </p>
        ) : (
          <div className="space-y-2">
            {allSessions.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900 rounded-xl px-4 py-3 flex items-center justify-between gap-4"
              >
                {/* Infos principales */}
                <div className="flex items-center gap-3 min-w-0">
                  <SportBadge sport={s.sportType} />
                  <span className="text-sm tabular-nums text-slate-400 shrink-0">{s.date}</span>
                  <span className="text-sm font-medium text-slate-200 shrink-0">{s.distance} km</span>
                  <span className="text-sm text-slate-500 shrink-0">{Math.round(s.duration / 60)} min</span>
                  {s.gearId && gearIndex[s.gearId] && (
                    <span className="text-xs text-slate-500 hidden md:block truncate">
                      {gearIndex[s.gearId]}
                    </span>
                  )}
                </div>

                {/* Charge + actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500 hidden sm:block">RPE {s.rpe}</span>
                  <span className="text-sm font-semibold text-amber-400 tabular-nums">
                    {s.calculatedLoad} UA
                  </span>
                  <Link
                    href={`/sessions/${s.id}/edit`}
                    className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded hover:bg-slate-800"
                  >
                    Éditer
                  </Link>
                  <form action={deleteSessionAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <DeleteConfirmButton message={`Supprimer la session du ${s.date} ?`} />
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function SportBadge({ sport }: { sport: string }) {
  const styles: Record<string, string> = {
    swim: 'bg-blue-900/60 text-blue-300',
    bike: 'bg-yellow-900/60 text-yellow-300',
    run: 'bg-green-900/60 text-green-300',
  }
  const labels: Record<string, string> = { swim: 'Natation', bike: 'Vélo', run: 'Course' }
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${styles[sport] ?? 'bg-slate-800 text-slate-300'}`}
    >
      {labels[sport] ?? sport}
    </span>
  )
}
