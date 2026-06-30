'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { addGearAction, type ActionState } from '@/lib/actions'
import { inputClass, selectClass, FormField } from '@/components/ui/form'
import { GEAR_TYPES } from '@/lib/constants/gear'

const initialState: ActionState = {}

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
        <FormField label="Nom">
          <input type="text" name="name" required placeholder="Nike Vaporfly Next%" className={inputClass} />
        </FormField>

        <FormField label="Type">
          <select
            name="type"
            required
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className={selectClass}
          >
            {GEAR_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Distance max (km)">
          <input type="number" name="distanceMax" required min={1} step={1} placeholder="800" className={inputClass} />
        </FormField>

        <FormField label="Date d'achat (optionnel)">
          <input type="date" name="purchaseDate" className={inputClass} />
        </FormField>

        {selectedType === 'bike' && (
          <FormField label="Dernière révision (optionnel)">
            <input type="date" name="lastMaintenanceDate" className={inputClass} />
          </FormField>
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
