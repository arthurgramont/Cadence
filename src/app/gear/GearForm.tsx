'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { addGearAction, type ActionState } from '@/lib/actions'

const initialState: ActionState = {}

const inputClass =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500 placeholder:text-slate-500'
const selectClass =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500'

const GEAR_TYPES = [
  { value: 'shoes', label: 'Chaussures de course' },
  { value: 'bike', label: 'Vélo' },
  { value: 'wetsuit', label: 'Combinaison' },
  { value: 'helmet', label: 'Casque' },
]

export function GearForm() {
  const [state, formAction, isPending] = useActionState(addGearAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const [selectedType, setSelectedType] = useState('shoes')

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset()
      setSelectedType('shoes')
    }
  }, [state.success])

  return (
    <section className="bg-slate-900 rounded-2xl p-6">
      <h2 className="text-base font-semibold text-slate-100 mb-5">Ajouter du matériel</h2>

      {state.error && (
        <div className="mb-4 rounded-lg bg-red-950/60 border border-red-800 px-4 py-2.5 text-sm text-red-300">
          {state.error}
        </div>
      )}
      {state.success && (
        <div className="mb-4 rounded-lg bg-green-950/60 border border-green-800 px-4 py-2.5 text-sm text-green-300">
          Matériel ajouté avec succès.
        </div>
      )}

      <form ref={formRef} action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Nom">
          <input
            type="text"
            name="name"
            required
            placeholder="Nike Vaporfly Next%"
            className={inputClass}
          />
        </Field>

        <Field label="Type">
          <select
            name="type"
            required
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={selectClass}
          >
            {GEAR_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Distance max (km)">
          <input
            type="number"
            name="distanceMax"
            required
            min={1}
            step={1}
            placeholder="800"
            className={inputClass}
          />
        </Field>

        <Field label="Date d'achat (optionnel)">
          <input type="date" name="purchaseDate" className={inputClass} />
        </Field>

        {/* Champ révision visible uniquement pour les vélos */}
        {selectedType === 'bike' && (
          <Field label="Dernière révision (optionnel)">
            <input type="date" name="lastMaintenanceDate" className={inputClass} />
          </Field>
        )}

        <div className="sm:col-span-3 flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            Conseils : chaussures ~800 km · vélo ~15 000 km · combinaison ~200 km
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="bg-slate-100 text-slate-800 text-sm font-medium px-5 py-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Enregistrement…' : 'Ajouter'}
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
