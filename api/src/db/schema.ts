import { boolean, integer, jsonb, pgTable, real, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * One row per person. Identity is the Clerk user id; the app stores no email,
 * real name or date of birth (docs/features/profile.md).
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  clerkUserId: text('clerk_user_id').notNull().unique(),
  name: text('name'),
  over18: boolean('over18'),
  age: integer('age'),
  sex: text('sex'),
  weightKg: real('weight_kg'),
  activityLevel: text('activity_level'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** A dated answer to "What's bugging you". */
export const complaintSnapshots = pgTable('complaint_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  complaintIds: text('complaint_ids').array().notNull(),
  freeText: text('free_text'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** A WHO-5 baseline. The score is computed from the stored answers by the backend. */
export const baselineCheckins = pgTable('baseline_checkins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  answers: integer('answers').array().notNull(),
  score: integer('score').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** A quick "today" entry. */
export const todayCheckins = pgTable('today_checkins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mood: integer('mood').notNull(),
  energy: integer('energy').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A dated "how it usually is" questionnaire for one life area. The score and
 * gaps are computed by code from the answers and stored, so history stays
 * stable if the questionnaire content is tuned later.
 */
export const areaCheckins = pgTable('area_checkins', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  area: text('area').notNull(),
  answers: jsonb('answers').$type<Record<string, string>>().notNull(),
  score: integer('score').notNull(),
  answered: integer('answered').notNull(),
  gaps: text('gaps').array().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * The points ledger. Each row is one award: what was earned, when, for what.
 * Totals are always calculated from this table, never stored.
 */
export const pointsLedger = pgTable('points_ledger', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  points: integer('points').notNull(),
  reason: text('reason').notNull(),
  /** The entry or field this award was for. */
  refId: text('ref_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
