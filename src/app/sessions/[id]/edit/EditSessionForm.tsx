'use client'

import { useActionState } from 'react'
import { editSessionAction, type ActionState } from '@/lib/actions'
import Link from 'next/link'

const initialState: ActionState = {}

const inputClass =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500'
const selectClass =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500'

interface Session {
  id: string
  sportType: 'swim' | 'bike' | 'run'
  date: string
  duration: number
  distance: number
  rpe: number
  gearId: string | null
}

interface GearOption {
  id: string
  name: string
}

/**
 * Formulaire d'édition de session.
 * Les defaultValue sont pré-remplis depuis la session existante (props serveur).
 * La durée est affichée en minutes (stockée en secondes en base).
 */
export function EditSessionForm({
  session,
  gearOptions,
}: {
  session: Session
  gearOptions: GearOption[]
}) {
  const [state, formAction, isPending] = useActionState(editSessionAction, initialState)

  return (
    <section className="bg-slate-900 rounded-2xl p-6">
      {state.error && (
        <div className="mb-4 rounded-lg bg-red-950/60 border border-red-800 px-4 py-2.5 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <form action={formAction} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {/* ID caché — transmis à l'action pour identifier la session */}
        <input type="hidden" name="id" value={session.id} />

        <Field label="Sport">
          <select name="sportType" required defaultValue={session.sportType} className={selectClass}>
            <option value="run">Course à pied</option>
            <option value="bike">Vélo</option>
            <option value="swim">Natation</option>
          </select>
        </Field>

        <Field label="Date">
          <input
            type="date"
            name="date"
            required
            defaultValue={session.date}
            className={inputClass}
          />
        </Field>

        <Field label="Durée (minutes)">
          <input
            type="number"
            name="duration"
            required
            min={1}
            step={1}
            defaultValue={Math.round(session.duration / 60)}
            className={inputClass}
          />
        </Field>

        <Field label="Distance (km)">
          <input
            type="number"
            name="distance"
            required
            min={0.01}
            step={0.01}
            defaultValue={session.distance}
            className={inputClass}
          />
        </Field>

        <Field label="RPE (1–10)">
          <input
            type="number"
            name="rpe"
            required
            min={1}
            max={10}
            step={1}
            defaultValue={session.rpe}
            className={inputClass}
          />
        </Field>

        <Field label="Matériel utilisé">
          <select
            name="gearId"
            defaultValue={session.gearId ?? ''}
            className={selectClass}
          >
            <option value="">Aucun</option>
            {gearOptions.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="col-span-2 sm:col-span-3 flex items-center justify-between pt-2">
          <Link
            href="/sessions"
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            ← Annuler
          </Link>
          <button
            type="submit"
            disabled={isPending}
            className="bg-slate-100 text-slate-800 text-sm font-medium px-5 py-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Enregistrement…' : 'Sauvegarder'}
          </button>
        </div>
      </form>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  )
}
