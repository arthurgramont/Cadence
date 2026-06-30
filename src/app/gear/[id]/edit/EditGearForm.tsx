'use client'

import { useActionState, useState } from 'react'
import { editGearAction, type ActionState } from '@/lib/actions'
import { inputClass, selectClass, FormField } from '@/components/ui/form'
import { GEAR_TYPES } from '@/lib/constants/gear'
import Link from 'next/link'

const initialState: ActionState = {}

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

        <FormField label="Nom">
          <input type="text" name="name" required defaultValue={gear.name} className={inputClass} />
        </FormField>

        <FormField label="Type">
          <select
            name="type"
            required
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as GearData['type'])}
            className={selectClass}
          >
            {GEAR_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Distance max (km)">
          <input
            type="number" name="distanceMax" required min={1} step={1}
            defaultValue={gear.distanceMax} className={inputClass}
          />
        </FormField>

        <FormField label="Statut">
          <select name="status" defaultValue={gear.status} className={selectClass}>
            <option value="active">En service</option>
            <option value="retired">Retraité</option>
          </select>
        </FormField>

        <FormField label="Date d'achat">
          <input type="date" name="purchaseDate" defaultValue={gear.purchaseDate ?? ''} className={inputClass} />
        </FormField>

        {selectedType === 'bike' && (
          <FormField label="Dernière révision">
            <input type="date" name="lastMaintenanceDate" defaultValue={gear.lastMaintenanceDate ?? ''} className={inputClass} />
          </FormField>
        )}

        <div className="sm:col-span-2 flex items-center justify-between pt-2">
          <Link href="/gear" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
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
