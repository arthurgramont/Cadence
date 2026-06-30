/**
 * Point d'entrée unique pour toutes les Server Actions.
 * Les composants importent depuis '@/lib/actions' — ce fichier reste stable.
 *
 * Implémentation découpée pour respecter la règle <250 lignes/fichier :
 *   src/lib/actions/sessions.ts  — CRUD sessions ('use server')
 *   src/lib/actions/gear.ts      — CRUD matériel ('use server')
 *   src/lib/actions/shared.ts    — types partagés + validators
 *
 * Note : pas de 'use server' ici — la directive est dans chaque sous-fichier.
 * Un barrel 'use server' bloque les ré-exports sous Turbopack/Next.js 16.
 */

export type { ActionState } from './actions/shared'
export { addSessionAction, editSessionAction, deleteSessionAction } from './actions/sessions'
export { addGearAction, editGearAction, deleteGearAction } from './actions/gear'
