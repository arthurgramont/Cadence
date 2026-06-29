'use client'

import { useActionState, useState } from 'react'
import { editGearAction, type ActionState } from '@/lib/actions'
import Link from 'next/link'

const initialState: ActionState = {}

const inputClass =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500'
const selectClass =
  'w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-500'

const GEAR_TYPES = [
  { value: 'shoes', label: 'Chaussures de course' },
  { value: 'bike', label: 'Vélo' },
  { value: 'wetsuit', label: 'Combinaison' },
  { value: 'helmet', label: 'Casque' },
]

interface GearData {
  id: string
  name: string
  type: 'shoes' | 'bike' | 'wetsuit' | 'helmet'
  distanceMax: number
  purchaseDate: string | null
  lastMaintenanceDate: string | null
  status: 'active' | 'retired'
}

export function EditGearForm({ gear }: { gear: GearData }) {
  const [state, formAction, isPending] = useActionState(editGearAction, initialState)
  const [selectedType, setSelectedType] = useState(gear.type)

  return (
    <section className="bg-slate-900 rounded-2xl p-6">
      {state.error && (
        <div className="mb-4 rounded-lg bg-red-950/60 border border-red-800 px-4 py-2.5 text-sm text-red-300">
          {state.error}
        </div>
      )}

      <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <input type="hidden" name="id" value={gear.id} />

        <Field label="Nom">
          <input
            type="text"
            name="name"
            required
            defaultValue={gear.name}
            className={inputClass}
          />
        </Field>

        <Field label="Type">
          <select
            name="type"
            required
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as GearData['type'])}
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
            defaultValue={gear.distanceMax}
            className={inputClass}
          />
        </Field>

        <Field label="Statut">
          <select name="status" defaultValue={gear.status} className={selectClass}>
            <option value="active">En service</option>
            <option value="retired">Retraité</option>
          </select>
        </Field>

        <Field label="Date d'achat">
          <input
            type="date"
            name="purchaseDate"
            defaultValue={gear.purchaseDate ?? ''}
            className={inputClass}
          />
        </Field>

        {selectedType === 'bike' && (
          <Field label="Dernière révision">
            <input
              type="date"
              name="lastMaintenanceDate"
              defaultValue={gear.lastMaintenanceDate ?? ''}
              className={inputClass}
            />
          </Field>
        )}

        <div className="sm:col-span-2 flex items-center justify-between pt-2">
          <Link
            href="/gear"
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
