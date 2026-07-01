'use client'

import { useActionState, useState } from 'react'
import { addGearAction, type ActionState } from '@/lib/actions'
import { inputClass, selectClass, FormField, FormBanner } from '@/components/ui/form'
import { GEAR_TYPES } from '@/lib/constants/gear'

const initialState: ActionState = {}

function GearInputs({ selectedType, onTypeChange }: { selectedType: string; onTypeChange: (t: string) => void }) {
  return (
    <>
      <FormField label="Nom">
        <input type="text" name="name" required placeholder="Nike Vaporfly Next%" className={inputClass} />
      </FormField>
      <FormField label="Type">
        <select name="type" required value={selectedType} onChange={(e) => onTypeChange(e.target.value)} className={selectClass}>
          {GEAR_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
    </>
  )
}

function GearFormBody({ formAction, isPending }: { formAction: (formData: FormData) => void; isPending: boolean }) {
  const [selectedType, setSelectedType] = useState('shoes')
  return (
    <form action={formAction} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <GearInputs selectedType={selectedType} onTypeChange={setSelectedType} />
      <div className="sm:col-span-3 flex items-center justify-between pt-2">
        <p className="text-xs text-slate-500">Conseils : chaussures ~800 km · vélo ~15 000 km · combinaison ~200 km</p>
        <button
          type="submit"
          disabled={isPending}
          className="bg-slate-100 text-slate-800 text-sm font-medium px-5 py-2 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? 'Enregistrement…' : 'Ajouter'}
        </button>
      </div>
    </form>
  )
}

export function GearForm() {
  const [state, formAction, isPending] = useActionState(addGearAction, initialState)

  // state.formVersion changes on each successful submission (set by addGearAction).
  // Using it as the key remounts GearFormBody, resetting all inputs and selectedType.
  return (
    <section className="bg-slate-900 rounded-2xl p-6">
      <h2 className="text-base font-semibold text-slate-100 mb-5">Ajouter du matériel</h2>
      {state.error && <FormBanner type="error">{state.error}</FormBanner>}
      {state.success && <FormBanner type="success">Matériel ajouté avec succès.</FormBanner>}
      <GearFormBody key={state.formVersion ?? '0'} formAction={formAction} isPending={isPending} />
    </section>
  )
}
