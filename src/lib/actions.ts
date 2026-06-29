'use server'

/**
 * actions.ts — Source unique de vérité pour toutes les mutations DB.
 *
 * Toutes les fonctions sont des Server Functions Next.js ('use server').
 * Celles utilisées avec useActionState reçoivent (prevState, formData).
 * Celles appelées directement depuis un <form action={}> reçoivent (formData).
 */

import { db } from '@/db'
import { sessions, gear } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export type ActionState = { error?: string; success?: boolean }

// ─── Helpers de validation ────────────────────────────────────────────────────

function validateRpe(rpe: number): string | null {
  if (!Number.isFinite(rpe) || rpe < 1 || rpe > 10)
    return 'Le RPE doit être un entier entre 1 et 10.'
  return null
}

function validateDistance(distance: number): string | null {
  if (!Number.isFinite(distance) || distance <= 0)
    return 'La distance doit être strictement positive.'
  return null
}

function validateDuration(min: number): string | null {
  if (!Number.isFinite(min) || min < 1) return "La durée doit être d'au moins 1 minute."
  return null
}

// ─── Sessions : CREATE ────────────────────────────────────────────────────────

/**
 * CALCUL DE CHARGE (méthode Foster/RPE session)
 * charge = durée (minutes) × RPE
 *
 * Durée = volume, RPE = intensité perçue (1–10). Leur produit donne des "unités
 * arbitraires" (UA) comparables entre disciplines, sans capteur.
 *
 * COHÉRENCE gear.distance_cumulated
 * L'insert session et l'update gear sont dans la MÊME transaction.
 * En cas d'erreur partielle, les deux opérations sont annulées ensemble.
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
  } catch {
    return { error: "Erreur lors de l'enregistrement. Veuillez réessayer." }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// ─── Sessions : UPDATE ────────────────────────────────────────────────────────

/**
 * Met à jour une session et recalcule la distance cumulée du matériel.
 *
 * Cas couverts par la transaction :
 *   – même gear, distance changée  → delta = newDist - oldDist
 *   – gear changé                  → décrémente l'ancien, incrémente le nouveau
 *   – gear supprimé (→ null)       → décrémente l'ancien
 *   – gear ajouté (null → id)      → incrémente le nouveau
 *
 * Après succès, redirige vers /sessions (redirect() lève une erreur capturée par Next.js).
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

      // Ajustement du compteur kilométrique du matériel
      if (oldGearId === newGearId) {
        // Même équipement : on applique uniquement le delta de distance
        if (newGearId && newDistance !== oldDistance) {
          const delta = newDistance - oldDistance
          await tx
            .update(gear)
            .set({ distanceCumulated: sql`max(0.0, ${gear.distanceCumulated} + ${delta})` })
            .where(eq(gear.id, newGearId))
        }
      } else {
        // Équipement changé : décrémente l'ancien, incrémente le nouveau
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
  } catch {
    return { error: "Erreur lors de la mise à jour. Veuillez réessayer." }
  }

  revalidatePath('/', 'layout')
  redirect('/sessions')
}

// ─── Sessions : DELETE ────────────────────────────────────────────────────────

/**
 * Supprime la session et décrémente la distance cumulée du matériel associé.
 * Utilise max(0, ...) pour éviter un compteur négatif en cas de données incohérentes.
 */
export async function deleteSessionAction(formData: FormData): Promise<void> {
  const id = formData.get('id') as string
  if (!id) return

  const [existing] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1)
  if (!existing) return

  await db.transaction(async (tx) => {
    await tx.delete(sessions).where(eq(sessions.id, id))

    if (existing.gearId) {
      await tx
        .update(gear)
        .set({ distanceCumulated: sql`max(0.0, ${gear.distanceCumulated} - ${existing.distance})` })
        .where(eq(gear.id, existing.gearId))
    }
  })

  revalidatePath('/', 'layout')
}

// ─── Gear : CREATE ────────────────────────────────────────────────────────────

/**
 * Crée un équipement. distanceCumulated démarre à 0 et s'incrémente
 * automatiquement à chaque session associée via addSessionAction/editSessionAction.
 */
export async function addGearAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = (formData.get('name') as string).trim()
  const type = formData.get('type') as 'shoes' | 'bike' | 'wetsuit' | 'helmet'
  const distanceMax = Number(formData.get('distanceMax'))
  const purchaseDate = (formData.get('purchaseDate') as string) || null
  const lastMaintenanceDate = (formData.get('lastMaintenanceDate') as string) || null

  if (!name) return { error: 'Le nom est obligatoire.' }
  if (!['shoes', 'bike', 'wetsuit', 'helmet'].includes(type))
    return { error: 'Type de matériel invalide.' }
  if (!Number.isFinite(distanceMax) || distanceMax < 1)
    return { error: 'La distance maximale doit être supérieure à 0 km.' }

  try {
    await db.insert(gear).values({
      id: crypto.randomUUID(),
      name,
      type,
      distanceCumulated: 0,
      distanceMax,
      purchaseDate,
      lastMaintenanceDate,
      status: 'active',
    })
  } catch {
    return { error: "Erreur lors de l'enregistrement. Veuillez réessayer." }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}

// ─── Gear : UPDATE ────────────────────────────────────────────────────────────

export async function editGearAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  const name = (formData.get('name') as string).trim()
  const type = formData.get('type') as 'shoes' | 'bike' | 'wetsuit' | 'helmet'
  const distanceMax = Number(formData.get('distanceMax'))
  const purchaseDate = (formData.get('purchaseDate') as string) || null
  const lastMaintenanceDate = (formData.get('lastMaintenanceDate') as string) || null
  const status = (formData.get('status') as 'active' | 'retired') || 'active'

  if (!id) return { error: 'Identifiant manquant.' }
  if (!name) return { error: 'Le nom est obligatoire.' }
  if (!['shoes', 'bike', 'wetsuit', 'helmet'].includes(type))
    return { error: 'Type de matériel invalide.' }
  if (!Number.isFinite(distanceMax) || distanceMax < 1)
    return { error: 'La distance maximale doit être supérieure à 0 km.' }

  try {
    await db
      .update(gear)
      .set({ name, type, distanceMax, purchaseDate, lastMaintenanceDate, status })
      .where(eq(gear.id, id))
  } catch {
    return { error: 'Erreur lors de la mise à jour. Veuillez réessayer.' }
  }

  revalidatePath('/', 'layout')
  redirect('/gear')
}

// ─── Gear : DELETE ────────────────────────────────────────────────────────────

/**
 * Supprime un équipement. Bloqué si des sessions y sont encore associées
 * (intégrité référentielle applicative — évite les compteurs orphelins).
 */
export async function deleteGearAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  if (!id) return { error: 'Identifiant manquant.' }

  // Vérification d'intégrité : aucune session ne doit référencer ce matériel
  const linked = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(eq(sessions.gearId, id))
    .limit(1)

  if (linked.length > 0)
    return {
      error:
        'Ce matériel est utilisé par des sessions enregistrées. Dissociez-le des sessions avant de le supprimer.',
    }

  try {
    await db.delete(gear).where(eq(gear.id, id))
  } catch {
    return { error: 'Erreur lors de la suppression.' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
