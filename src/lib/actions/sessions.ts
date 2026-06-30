'use server'

import { db } from '@/db'
import { sessions, gear } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { type ActionState, validateDuration, validateRpe, validateDistance } from './shared'

// ─── CREATE ───────────────────────────────────────────────────────────────────

/**
 * Insère une session et incrémente gear.distanceCumulated dans la même transaction.
 * Charge = durationMin × RPE (méthode Foster).
 */
export async function addSessionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const durationMin = Number(formData.get('duration'))
  const rpe = Number(formData.get('rpe'))
  const distance = Number(formData.get('distance'))
  const gearId = (formData.get('gearId') as string) || null
  const sportType = formData.get('sportType') as 'swim' | 'bike' | 'run'
  const date = formData.get('date') as string

  if (!date) return { error: 'La date est obligatoire.' }
  if (!['swim', 'bike', 'run'].includes(sportType)) return { error: 'Sport invalide.' }
  const err = validateDuration(durationMin) ?? validateRpe(rpe) ?? validateDistance(distance)
  if (err) return { error: err }

  const calculatedLoad = durationMin * rpe

  try {
    await db.transaction(async (tx) => {
      await tx.insert(sessions).values({
        id: crypto.randomUUID(),
        sportType,
        date,
        duration: durationMin * 60,
        distance,
        rpe,
        calculatedLoad,
        gearId,
        raceGoalId: null,
      })

      if (gearId) {
        await tx
          .update(gear)
          .set({ distanceCumulated: sql`${gear.distanceCumulated} + ${distance}` })
          .where(eq(gear.id, gearId))
      }
    })
  } catch (err) {
    console.error('[addSessionAction]', err)
    return { error: "Erreur lors de l'enregistrement. Veuillez réessayer." }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

/**
 * Met à jour une session et recalcule gear.distanceCumulated de façon atomique.
 *
 * Cas couverts :
 *   – même gear, distance changée  → delta = newDist - oldDist
 *   – gear changé                  → décrémente l'ancien, incrémente le nouveau
 *   – gear supprimé (→ null)       → décrémente l'ancien
 *   – gear ajouté (null → id)      → incrémente le nouveau
 */
export async function editSessionAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  const durationMin = Number(formData.get('duration'))
  const rpe = Number(formData.get('rpe'))
  const newDistance = Number(formData.get('distance'))
  const newGearId = (formData.get('gearId') as string) || null
  const sportType = formData.get('sportType') as 'swim' | 'bike' | 'run'
  const date = formData.get('date') as string

  if (!id) return { error: 'Identifiant manquant.' }
  if (!date) return { error: 'La date est obligatoire.' }
  if (!['swim', 'bike', 'run'].includes(sportType)) return { error: 'Sport invalide.' }
  const err = validateDuration(durationMin) ?? validateRpe(rpe) ?? validateDistance(newDistance)
  if (err) return { error: err }

  const [existing] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1)
  if (!existing) return { error: 'Session introuvable.' }

  const oldGearId = existing.gearId
  const oldDistance = existing.distance
  const calculatedLoad = durationMin * rpe

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(sessions)
        .set({ sportType, date, duration: durationMin * 60, distance: newDistance, rpe, calculatedLoad, gearId: newGearId })
        .where(eq(sessions.id, id))

      if (oldGearId === newGearId) {
        if (newGearId && newDistance !== oldDistance) {
          const delta = newDistance - oldDistance
          await tx
            .update(gear)
            .set({ distanceCumulated: sql`max(0.0, ${gear.distanceCumulated} + ${delta})` })
            .where(eq(gear.id, newGearId))
        }
      } else {
        if (oldGearId) {
          await tx
            .update(gear)
            .set({ distanceCumulated: sql`max(0.0, ${gear.distanceCumulated} - ${oldDistance})` })
            .where(eq(gear.id, oldGearId))
        }
        if (newGearId) {
          await tx
            .update(gear)
            .set({ distanceCumulated: sql`${gear.distanceCumulated} + ${newDistance}` })
            .where(eq(gear.id, newGearId))
        }
      }
    })
  } catch (err) {
    console.error('[editSessionAction]', err)
    return { error: 'Erreur lors de la mise à jour. Veuillez réessayer.' }
  }

  revalidatePath('/', 'layout')
  redirect('/sessions')
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * Supprime une session et décrémente gear.distanceCumulated dans la même transaction.
 * max(0.0, ...) protège contre un compteur négatif en cas de données incohérentes.
 */
export async function deleteSessionAction(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return

  const [existing] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1)
  if (!existing) return

  try {
    await db.transaction(async (tx) => {
      await tx.delete(sessions).where(eq(sessions.id, id))

      if (existing.gearId) {
        await tx
          .update(gear)
          .set({ distanceCumulated: sql`max(0.0, ${gear.distanceCumulated} - ${existing.distance})` })
          .where(eq(gear.id, existing.gearId))
      }
    })
  } catch (err) {
    console.error('[deleteSessionAction]', err)
    throw err
  }

  revalidatePath('/', 'layout')
}
