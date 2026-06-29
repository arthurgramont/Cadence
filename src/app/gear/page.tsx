import { db } from '@/db'
import { gear } from '@/db/schema'
import Link from 'next/link'
import { GearForm } from './GearForm'
import { GearDeleteForm } from './GearDeleteForm'

const GEAR_LABELS: Record<string, string> = {
  shoes: 'Chaussures de course',
  bike: 'Vélo',
  wetsuit: 'Combinaison',
  helmet: 'Casque',
}

export default async function GearPage() {
  const allGear = await db.select().from(gear)
  const active = allGear.filter((g) => g.status === 'active')
  const retired = allGear.filter((g) => g.status === 'retired')

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold text-slate-100">Matériel</h1>

      <GearForm />

      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          En service ({active.length})
        </h2>
        {active.length === 0 ? (
          <p className="text-slate-500 text-sm bg-slate-900 rounded-xl px-4 py-5">
            Aucun matériel pour l&apos;instant.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {active.map((g) => (
              <GearCard key={g.id} g={g} />
            ))}
          </div>
        )}
      </section>

      {retired.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Retraité ({retired.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {retired.map((g) => (
              <GearCard key={g.id} g={g} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function GearCard({
  g,
}: {
  g: {
    id: string
    name: string
    type: string
    distanceCumulated: number
    distanceMax: number
    status: string
    purchaseDate: string | null
    lastMaintenanceDate: string | null
  }
}) {
  const pct = Math.min(100, Math.round((g.distanceCumulated / g.distanceMax) * 100))
  const isWorn = pct >= 80
  const isCritical = pct >= 100

  return (
    <div className="bg-slate-900 rounded-xl p-4">
      {/* En-tête : nom + pourcentage */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-medium text-slate-100">{g.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{GEAR_LABELS[g.type] ?? g.type}</p>
        </div>
        <span
          className={`text-sm font-bold ${
            isCritical ? 'text-red-400' : isWorn ? 'text-amber-400' : 'text-green-400'
          }`}
        >
          {pct}%
        </span>
      </div>

      {/* Barre d'usure */}
      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all ${
            isCritical ? 'bg-red-500' : isWorn ? 'bg-amber-500' : 'bg-green-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Métriques */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-slate-500 tabular-nums">
          {g.distanceCumulated} / {g.distanceMax} km
        </p>
        {isCritical && <span className="text-xs text-red-400 font-medium">À remplacer</span>}
        {isWorn && !isCritical && (
          <span className="text-xs text-amber-400 font-medium">Usure élevée</span>
        )}
      </div>

      {/* Dates optionnelles */}
      <div className="flex gap-4 mb-4">
        {g.purchaseDate && (
          <p className="text-xs text-slate-600">Achat : {g.purchaseDate}</p>
        )}
        {g.lastMaintenanceDate && (
          <p className="text-xs text-slate-600">Révision : {g.lastMaintenanceDate}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-slate-800 pt-3">
        <Link
          href={`/gear/${g.id}/edit`}
          className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-2 py-1 rounded hover:bg-slate-800"
        >
          Éditer
        </Link>
        <GearDeleteForm gearId={g.id} gearName={g.name} />
      </div>
    </div>
  )
}
