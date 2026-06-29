import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

/**
 * Schéma Drizzle — 3 entités, 2 relations de clés étrangères.
 *
 * gear ←─── sessions.gear_id          (optionnelle)
 * raceGoals ←── sessions.race_goal_id (optionnelle)
 *
 * Invariant de cohérence : gear.distance_cumulated est toujours ajusté
 * dans la MÊME transaction que toute création, modification ou suppression
 * de session. Voir src/lib/actions.ts — ne jamais modifier ces tables séparément.
 */

// ─── 1. Matériel ──────────────────────────────────────────────────────────────

export const gear = sqliteTable('gear', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),

  // 'helmet' ajouté : suivi de l'usure temporelle (alerte si > 3 ans)
  type: text('type').$type<'shoes' | 'bike' | 'wetsuit' | 'helmet'>().notNull(),

  // Incrémenté/décrémenté automatiquement par les Server Actions sessions
  distanceCumulated: real('distance_cumulated').default(0).notNull(),

  // Kilométrage cible avant remplacement recommandé
  distanceMax: real('distance_max').notNull(),

  // Date d'achat — pour l'alerte âge casque/combinaison (> 3 ans)
  // Nullable : l'utilisateur peut ne pas la renseigner à la création
  purchaseDate: text('purchase_date'),

  // Dernière révision — pour l'alerte maintenance vélo (> 1 an sans révision)
  lastMaintenanceDate: text('last_maintenance_date'),

  status: text('status').$type<'active' | 'retired'>().default('active').notNull(),
});

// ─── 2. Objectifs de course ───────────────────────────────────────────────────

export const raceGoals = sqliteTable('race_goals', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  date: text('date').notNull(),
  targetDistance: real('target_distance').notNull(), // en km
  targetTime: integer('target_time').notNull(),       // en secondes
  status: text('status').$type<'in_progress' | 'achieved' | 'failed'>().default('in_progress').notNull(),
});

// ─── 3. Sessions d'entraînement ───────────────────────────────────────────────

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  sportType: text('sport_type').$type<'swim' | 'bike' | 'run'>().notNull(),
  date: text('date').notNull(),            // ISO 8601 : "YYYY-MM-DD"
  duration: integer('duration').notNull(), // en secondes (converti depuis les minutes du formulaire)
  distance: real('distance').notNull(),    // en km

  // RPE (Rate of Perceived Exertion) : 1 = très facile, 10 = maximal
  rpe: integer('rpe').notNull(),

  // Charge = durée (minutes) × RPE — méthode Foster, stocké à l'insertion
  calculatedLoad: integer('calculated_load').notNull(),

  // Clés étrangères optionnelles
  gearId: text('gear_id').references(() => gear.id),
  raceGoalId: text('race_goal_id').references(() => raceGoals.id),
});
