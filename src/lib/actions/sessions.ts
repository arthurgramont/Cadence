'use server'

import { db } from '@/db'
import { sessions, gear } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { type ActionState, validateDuration, validateRpe, validateDistance } from './shared'

// ─── Helpers ──────────────────────────────────────────────────────────────────

type GearOp = { gearId: string; delta: number }

/**
 * Calcule les opérations de mise à jour du kilométrage gear après modification d'une session.
 * Gère les 4 cas : même gear (delta), gear changé, gear retiré, gear ajouté.
 */
function gearDeltaOps(
  oldGearId: string | null,
  newGearId: string | null,
  oldDistance: number,
  newDistance: number,
): GearOp[] {
  if (oldGearId === newGearId) {
    if (!newGearId || newDistance === oldDistance) return []
    return [{ gearId: newGearId, delta: newDistance - oldDistance }]
  }
  const ops: GearOp[] = []
  if (oldGearId) ops.push({ gearId: oldGearId, delta: -oldDistance })
  if (newGearId) ops.push({ gearId: newGearId, delta: newDistance })
  return ops
}

// ─── CREATE ───────────────────────────────────────────────────────────────────

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
      if (!gearId) return
      await tx
        .update(gear)
        .set({ distanceCumulated: sql`${gear.distanceCumulated} + ${distance}` })
        .where(eq(gear.id, gearId))
    })
  } catch (err) {
    console.error('[addSessionAction]', err)
    return { error: "Erreur lors de l'enregistrement. Veuillez réessayer." }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

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

  const calculatedLoad = durationMin * rpe

  try {
    await db.transaction(async (tx) => {
      await tx
        .update(sessions)
        .set({ sportType, date, duration: durationMin * 60, distance: newDistance, rpe, calculatedLoad, gearId: newGearId })
        .where(eq(sessions.id, id))

      await Promise.all(
        gearDeltaOps(existing.gearId, newGearId, existing.distance, newDistance).map((op) =>
          tx.update(gear)
            .set({ distanceCumulated: sql`max(0.0, ${gear.distanceCumulated} + ${op.delta})` })
            .where(eq(gear.id, op.gearId))
        ),
      )
    })
  } catch (err) {
    console.error('[editSessionAction]', err)
    return { error: 'Erreur lors de la mise à jour. Veuillez réessayer.' }
  }

  revalidatePath('/', 'layout')
  redirect('/sessions')
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function deleteSessionAction(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return

  const [existing] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1)
  if (!existing) return

  try {
    await db.transaction(async (tx) => {
      await tx.delete(sessions).where(eq(sessions.id, id))
      if (!existing.gearId) return
      await tx
        .update(gear)
        .set({ distanceCumulated: sql`max(0.0, ${gear.distanceCumulated} - ${existing.distance})` })
        .where(eq(gear.id, existing.gearId))
    })
  } catch (err) {
    console.error('[deleteSessionAction]', err)
    throw err
  }

  revalidatePath('/', 'layout')
}
