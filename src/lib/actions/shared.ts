export type ActionState = { error?: string; success?: boolean }

export function validateRpe(rpe: number): string | null {
  if (!Number.isFinite(rpe) || rpe < 1 || rpe > 10)
    return 'Le RPE doit être un entier entre 1 et 10.'
  return null
}

export function validateDistance(distance: number): string | null {
  if (!Number.isFinite(distance) || distance <= 0)
    return 'La distance doit être strictement positive.'
  return null
}

export function validateDuration(min: number): string | null {
  if (!Number.isFinite(min) || min < 1) return "La durée doit être d'au moins 1 minute."
  return null
}
