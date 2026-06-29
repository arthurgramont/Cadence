'use client'

import { useActionState } from 'react'
import { deleteGearAction, type ActionState } from '@/lib/actions'

const initial: ActionState = {}

interface Props {
  gearId: string
  gearName: string
}

/**
 * Formulaire de suppression de matériel avec gestion d'erreur inline.
 * Utilise useActionState pour afficher l'erreur "sessions liées" sans rechargement.
 */
export function GearDeleteForm({ gearId, gearName }: Props) {
  const [state, formAction, isPending] = useActionState(deleteGearAction, initial)

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="id" value={gearId} />
        <button
          type="submit"
          disabled={isPending}
          onClick={(e) => {
            if (!window.confirm(`Supprimer « ${gearName} » ?`)) e.preventDefault()
          }}
          className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-950/40 disabled:opacity-50"
        >
          {isPending ? '…' : 'Supprimer'}
        </button>
      </form>
      {state.error && (
        <p className="text-xs text-red-400 mt-1 max-w-[200px] leading-tight">{state.error}</p>
      )}
    </div>
  )
}
