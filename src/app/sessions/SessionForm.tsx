'use client'

import { useActionState, useEffect, useRef } from 'react'
import { addSessionAction, type ActionState } from '@/lib/actions'
import { inputClass, selectClass, FormField, FormBanner } from '@/components/ui/form'

const initialState: ActionState = {}

interface GearOption {
  id: string
  name: string
}

function SessionInputs({ gearOptions }: { gearOptions: GearOption[] }) {
  return (
    <>
      <FormField label="Sport">
        <select name="sportType" required className={selectClass}>
          <option value="run">Course à pied</option>
          <option value="bike">Vélo</option>
          <option value="swim">Natation</option>
        </select>
      </FormField>
      <FormField label="Date">
        <input type="date" name="date" required className={inputClass} />
      </FormField>
      <FormField label="Durée (minutes)">
        <input type="number" name="duration" required min={1} step={1} placeholder="45" className={inputClass} />
      </FormField>
      <FormField label="Distance (km)">
        <input type="number" name="distance" required min={0.01} step={0.01} placeholder="10.5" className={inputClass} />
      </FormField>
      <FormField label="RPE (1–10)">
        <input type="number" name="rpe" required min={1} max={10} step={1} placeholder="7" className={inputClass} />
      </FormField>
      <FormField label="Matériel utilisé">
        <select name="gearId" className={selectClass}>
          <option value="">Aucun</option>
          {gearOptions.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </FormField>
    </>
  )
}

export function SessionForm({ gearOptions }: { gearOptions: GearOption[] }) {
  const [state, formAction, isPending] = useActionState(addSessionAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state.success) formRef.current?.reset()
  }, [state.success])

  return (
    <section className="bg-slate-900 rounded-2xl p-6">
      <h2 className="text-base font-semibold text-slate-100 mb-5">Ajouter une session</h2>
      {state.error && <FormBanner type="error">{state.error}</FormBanner>}
      {state.success && <FormBanner type="success">Session ajoutée — le matériel a été mis à jour.</FormBanner>}
      <form ref={formRef} action={formAction} className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <SessionInputs gearOptions={gearOptions} />
        <div className="col-span-2 sm:col-span-3 flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">Charge = durée (min) × RPE — ex : 45 min à RPE 7 = 315 UA</p>
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
