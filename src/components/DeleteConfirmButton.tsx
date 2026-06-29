'use client'

interface Props {
  message?: string
}

/**
 * Bouton de suppression avec confirmation native (window.confirm).
 * Doit être rendu à l'intérieur d'un <form action={serverAction}>.
 * Si l'utilisateur annule, e.preventDefault() bloque la soumission.
 */
export function DeleteConfirmButton({ message = 'Confirmer la suppression ?' }: Props) {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault()
      }}
      className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-950/40"
    >
      Supprimer
    </button>
  )
}
