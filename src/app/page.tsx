import { db } from '@/db'
import { sessions, gear } from '@/db/schema'
import { gte } from 'drizzle-orm'
import Link from 'next/link'
import { SportBadge } from '@/components/SportBadge'

// ─── Seuils d'alerte (constantes métier — ne pas hardcoder ailleurs) ──────────

const WEAR_WARNING_PCT = 0.8   // alerte usure élevée à 80 % du kilométrage max
const WEAR_CRITICAL_PCT = 1.0  // critique à 100 %
const SAFETY_MAX_AGE_YEARS = 3 // âge max avant alerte casque/combinaison (normes sécurité)
const MAINTENANCE_MAX_AGE_YEARS = 1 // délai max sans révision pour un vélo

// ─── Helpers d'alerte temporelle ─────────────────────────────────────────────

function isOlderThan(dateStr: string | null | undefined, years: number): boolean {
  if (!dateStr) return false
  const threshold = new Date()
  threshold.setFullYear(threshold.getFullYear() - years)
  return new Date(dateStr) < threshold
}

type GearAlert = {
  id: string
  name: string
  reason: string
  level: 'critical' | 'warning'
}

function getGearAlerts(g: {
  id: string
  name: string
  type: string
  distanceCumulated: number
  distanceMax: number
  purchaseDate: string | null
  lastMaintenanceDate: string | null
  status: string
}): GearAlert[] {
  if (g.status === 'retired') return []
  const alerts: GearAlert[] = []
  const pct = g.distanceCumulated / g.distanceMax

  if (pct >= WEAR_CRITICAL_PCT) {
    alerts.push({ id: g.id, name: g.name, reason: `Kilométrage dépassé (${Math.round(pct * 100)} % du max)`, level: 'critical' })
  } else if (pct >= WEAR_WARNING_PCT) {
    alerts.push({ id: g.id, name: g.name, reason: `Usure élevée (${Math.round(pct * 100)} % du max)`, level: 'warning' })
  }

  if ((g.type === 'helmet' || g.type === 'wetsuit') && isOlderThan(g.purchaseDate, SAFETY_MAX_AGE_YEARS)) {
    alerts.push({ id: g.id, name: g.name, reason: "Achat > 3 ans — vérifier l'état et les normes de sécurité", level: 'warning' })
  }

  if (g.type === 'bike' && (!g.lastMaintenanceDate || isOlderThan(g.lastMaintenanceDate, MAINTENANCE_MAX_AGE_YEARS))) {
    const label = g.lastMaintenanceDate ? 'Révision > 1 an' : 'Aucune révision enregistrée'
    alerts.push({ id: g.id, name: g.name, reason: label, level: 'warning' })
  }

  return alerts
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function Home() {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  const weekStartStr = weekStart.toISOString().split('T')[0]

  const [weeklySessions, allGear] = await Promise.all([
    db.select().from(sessions).where(gte(sessions.date, weekStartStr)),
    db.select().from(gear),
  ])

  const totalLoad = weeklySessions.reduce((sum, s) => sum + s.calculatedLoad, 0)
  const loadBySport = {
    swim: weeklySessions.filter((s) => s.sportType === 'swim').reduce((sum, s) => sum + s.calculatedLoad, 0),
    bike: weeklySessions.filter((s) => s.sportType === 'bike').reduce((sum, s) => sum + s.calculatedLoad, 0),
    run:  weeklySessions.filter((s) => s.sportType === 'run').reduce((sum, s) => sum + s.calculatedLoad, 0),
  }

  const allAlerts = allGear.flatMap(getGearAlerts)
  const sortedSessions = [...weeklySessions].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">7 derniers jours</p>
        </div>
        <Link
          href="/sessions"
          className="bg-slate-100 text-slate-800 text-sm font-medium px-4 py-2 rounded-lg hover:bg-white transition-colors"
        >
          + Session
        </Link>
      </div>

      {/* Charge d'entraînement */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Charge d&apos;entraînement
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total" value={totalLoad} unit="UA" color="text-slate-100" />
          <StatCard label="Natation" value={loadBySport.swim} unit="UA" color="text-blue-400" />
          <StatCard label="Vélo" value={loadBySport.bike} unit="UA" color="text-yellow-400" />
          <StatCard label="Course" value={loadBySport.run} unit="UA" color="text-green-400" />
        </div>
      </section>

      {/* Alertes matériel */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Alertes matériel ({allAlerts.length})
        </h2>
        {allAlerts.length === 0 ? (
          <p className="text-slate-500 text-sm bg-slate-900 rounded-xl px-4 py-5">
            Tout le matériel est en bon état.
          </p>
        ) : (
          <div className="space-y-2">
            {allAlerts.map((alert, i) => (
              <div
                key={`${alert.id}-${i}`}
                className={`flex items-center justify-between rounded-xl px-4 py-3 border ${
                  alert.level === 'critical'
                    ? 'bg-red-950/60 border-red-800'
                    : 'bg-amber-950/60 border-amber-800'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">{alert.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{alert.reason}</p>
                </div>
                <Link
                  href={`/gear/${alert.id}/edit`}
                  className={`text-xs font-medium ml-4 shrink-0 ${
                    alert.level === 'critical' ? 'text-red-400 hover:text-red-300' : 'text-amber-400 hover:text-amber-300'
                  } transition-colors`}
                >
                  Gérer →
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sessions de la semaine */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Sessions de la semaine ({weeklySessions.length})
        </h2>
        {sortedSessions.length === 0 ? (
          <p className="text-slate-500 text-sm bg-slate-900 rounded-xl px-4 py-5">
            Aucune session cette semaine.{' '}
            <Link href="/sessions" className="text-slate-300 underline">
              Ajouter une session
            </Link>
          </p>
        ) : (
          <div className="space-y-2">
            {sortedSessions.map((s) => (
              <div
                key={s.id}
                className="bg-slate-900 rounded-xl px-4 py-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <SportBadge sport={s.sportType} />
                  <span className="text-sm text-slate-400">{s.date}</span>
                  <span className="text-sm text-slate-200">{s.distance} km</span>
                  <span className="text-sm text-slate-500">{Math.round(s.duration / 60)} min</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">RPE {s.rpe}</span>
                  <span className="text-sm font-semibold text-amber-400">{s.calculatedLoad} UA</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  return (
    <div className="bg-slate-900 rounded-xl p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold tabular-nums ${color}`}>{value}</p>
      <p className="text-xs text-slate-600 mt-1">{unit}</p>
    </div>
  )
}
