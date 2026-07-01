import { db } from '@/db'
import { sessions, gear } from '@/db/schema'
import { gte, eq } from 'drizzle-orm'
import Link from 'next/link'

export const dynamic = 'force-dynamic';

const SPORT_LABELS: Record<string, string> = {
  swim: 'Natation',
  bike: 'Vélo',
  run: 'Course',
}

const SPORT_COLORS: Record<string, string> = {
  swim: 'text-blue-400',
  bike: 'text-yellow-400',
  run: 'text-green-400',
}

function getMondayISO(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

function getAlertReason(g: {
  type: string
  distanceCumulated: number
  distanceMax: number
  purchaseDate: string | null
  lastMaintenanceDate: string | null
}): string | null {
  const pct = g.distanceCumulated / g.distanceMax
  if (pct >= 1) return `Kilométrage dépassé (${Math.round(pct * 100)} %)`
  if (pct >= 0.8) return `Usure élevée (${Math.round(pct * 100)} %)`

  const now = new Date()

  if ((g.type === 'helmet' || g.type === 'wetsuit') && g.purchaseDate) {
    const diffYears =
      (now.getTime() - new Date(g.purchaseDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    if (diffYears >= 3) return `Âge > 3 ans (acheté le ${g.purchaseDate})`
  }

  if (g.type === 'bike' && g.lastMaintenanceDate) {
    const diffYears =
      (now.getTime() - new Date(g.lastMaintenanceDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    if (diffYears >= 1) return `Révision > 1 an (dernière : ${g.lastMaintenanceDate})`
  }

  return null
}

const SPORT_BAR_COLOR: Record<string, string> = {
  swim: 'bg-blue-500',
  bike: 'bg-yellow-500',
  run: 'bg-green-500',
}

function SportBreakdown({ loadByType, totalLoad }: { loadByType: Record<string, number>; totalLoad: number }) {
  return (
    <section className="bg-slate-900 rounded-2xl p-5">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Répartition de la charge</h2>
      <div className="space-y-3">
        {(['swim', 'bike', 'run'] as const).map((sport) => {
          const load = loadByType[sport] ?? 0
          const pct = totalLoad > 0 ? Math.round((load / totalLoad) * 100) : 0
          return (
            <div key={sport}>
              <div className="flex justify-between text-sm mb-1">
                <span className={SPORT_COLORS[sport]}>{SPORT_LABELS[sport]}</span>
                <span className="text-slate-400 tabular-nums">{load} UA ({pct} %)</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${SPORT_BAR_COLOR[sport]}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

type GearAlert = { gear: { id: string; name: string }; reason: string }

function GearAlertList({ alerts }: { alerts: GearAlert[] }) {
  return (
    <section>
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Alertes matériel ({alerts.length})</h2>
      {alerts.length === 0 ? (
        <div className="bg-slate-900 rounded-xl px-4 py-5 text-sm text-slate-500">Tout est en ordre — aucune alerte.</div>
      ) : (
        <div className="space-y-2">
          {alerts.map(({ gear: g, reason }) => (
            <div key={g.id} className="bg-red-950/30 border border-red-800/50 rounded-xl px-4 py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-slate-100 text-sm">{g.name}</p>
                <p className="text-xs text-red-400 mt-0.5">{reason}</p>
              </div>
              <Link href={`/gear/${g.id}/edit`} className="text-xs text-slate-400 hover:text-slate-200 shrink-0 px-2 py-1 rounded hover:bg-slate-800 transition-colors">Gérer</Link>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function QuickNavLinks() {
  return (
    <section className="grid gap-3 sm:grid-cols-2">
      <Link href="/sessions" className="bg-slate-900 hover:bg-slate-800 transition-colors rounded-xl px-5 py-4 flex items-center justify-between">
        <span className="font-medium text-slate-200">Sessions</span>
        <span className="text-slate-500 text-sm">→</span>
      </Link>
      <Link href="/gear" className="bg-slate-900 hover:bg-slate-800 transition-colors rounded-xl px-5 py-4 flex items-center justify-between">
        <span className="font-medium text-slate-200">Matériel</span>
        <span className="text-slate-500 text-sm">→</span>
      </Link>
    </section>
  )
}

export default async function HomePage() {
  const weekStart = getMondayISO()
  const [weekSessions, allGear] = await Promise.all([
    db.select().from(sessions).where(gte(sessions.date, weekStart)),
    db.select().from(gear).where(eq(gear.status, 'active')),
  ])

  const totalLoad = weekSessions.reduce((sum, s) => sum + s.calculatedLoad, 0)
  const totalDistance = weekSessions.reduce((sum, s) => sum + s.distance, 0)
  const totalDurationMin = weekSessions.reduce((sum, s) => sum + Math.round(s.duration / 60), 0)
  const loadByType = weekSessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.sportType] = (acc[s.sportType] ?? 0) + s.calculatedLoad
    return acc
  }, {})
  const alerts = allGear
    .map((g) => ({ gear: g, reason: getAlertReason(g) }))
    .filter((a) => a.reason !== null) as GearAlert[]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Semaine du {weekStart}</p>
      </div>
      <section className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Charge totale" value={`${totalLoad} UA`} sub={`${weekSessions.length} session${weekSessions.length !== 1 ? 's' : ''}`} highlight />
        <StatCard label="Distance" value={`${totalDistance.toFixed(1)} km`} />
        <StatCard label="Temps d'entraînement" value={`${totalDurationMin} min`} />
      </section>
      {weekSessions.length > 0 && <SportBreakdown loadByType={loadByType} totalLoad={totalLoad} />}
      {weekSessions.length === 0 && (
        <div className="bg-slate-900 rounded-2xl p-6 text-center">
          <p className="text-slate-500 text-sm">Aucune session cette semaine.</p>
          <Link href="/sessions" className="mt-3 inline-block text-sm text-slate-300 hover:text-white underline underline-offset-4">Ajouter une session →</Link>
        </div>
      )}
      <GearAlertList alerts={alerts} />
      <QuickNavLinks />
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string
  value: string
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className={`rounded-2xl p-5 ${highlight ? 'bg-slate-100 text-slate-900' : 'bg-slate-900'}`}>
      <p className={`text-xs font-semibold uppercase tracking-widest mb-2 ${highlight ? 'text-slate-500' : 'text-slate-500'}`}>
        {label}
      </p>
      <p className={`text-3xl font-bold tabular-nums ${highlight ? 'text-slate-900' : 'text-slate-100'}`}>
        {value}
      </p>
      {sub && <p className={`text-sm mt-1 ${highlight ? 'text-slate-600' : 'text-slate-500'}`}>{sub}</p>}
    </div>
  )
}
