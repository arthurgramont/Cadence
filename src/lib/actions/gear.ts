'use server'

import { db } from '@/db'
import { sessions, gear } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { type ActionState } from './shared'
import { logAction } from '@/lib/utils/logger'

const VALID_GEAR_TYPES = ['shoes', 'bike', 'wetsuit', 'helmet'] as const

// ─── CREATE ───────────────────────────────────────────────────────────────────

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
  if (!VALID_GEAR_TYPES.includes(type)) return { error: 'Type de matériel invalide.' }
  if (!Number.isFinite(distanceMax) || distanceMax < 1)
    return { error: 'La distance maximale doit être supérieure à 0 km.' }

  const newId = crypto.randomUUID()

  try {
    await db.insert(gear).values({
      id: newId,
      name,
      type,
      distanceCumulated: 0,
      distanceMax,
      purchaseDate,
      lastMaintenanceDate,
      status: 'active',
    })
    logAction(`Ajout du matériel : ${name}`, { 
      gearId: newId, 
      type, 
      limiteKm: `${distanceMax} km` 
    })
  } catch (err) {
    console.error('[addGearAction]', err)
    return { error: "Erreur lors de l'enregistrement. Veuillez réessayer." }
  }

  revalidatePath('/', 'layout')
  return { success: true, formVersion: newId }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

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
  if (!VALID_GEAR_TYPES.includes(type)) return { error: 'Type de matériel invalide.' }
  if (!Number.isFinite(distanceMax) || distanceMax < 1)
    return { error: 'La distance maximale doit être supérieure à 0 km.' }

  try {
    await db
      .update(gear)
      .set({ name, type, distanceMax, purchaseDate, lastMaintenanceDate, status })
      .where(eq(gear.id, id))
    logAction(`Modification du matériel : ${name}`, { 
      gearId: id, 
      status, 
      limiteKm: `${distanceMax} km` 
    })
  } catch (err) {
    console.error('[editGearAction]', err)
    return { error: 'Erreur lors de la mise à jour. Veuillez réessayer.' }
  }

  revalidatePath('/', 'layout')
  redirect('/gear')
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

/**
 * Suppression bloquée si des sessions référencent encore ce matériel.
 * Intégrité référentielle applicative — évite les compteurs distanceCumulated orphelins.
 */
export async function deleteGearAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = formData.get('id') as string
  if (!id) return { error: 'Identifiant manquant.' }

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
    const [existingGear] = await db.select().from(gear).where(eq(gear.id, id)).limit(1)
    await db.delete(gear).where(eq(gear.id, id))
    logAction(`Suppression du matériel : ${existingGear?.name || id}`, { 
      gearId: id 
    })
  } catch (err) {
    console.error('[deleteGearAction]', err)
    return { error: 'Erreur lors de la suppression.' }
  }

  revalidatePath('/', 'layout')
  return { success: true }
}
