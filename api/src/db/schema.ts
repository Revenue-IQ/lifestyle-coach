import { boolean, index, integer, jsonb, pgTable, real, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core';

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
  /** Safety gates asked before the first coach session. Null means not asked yet. */
  pregnantOrBreastfeeding: boolean('pregnant_or_breastfeeding'),
  conditions: text('conditions'),
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

/**
 * The knowledge base: short guidance notes in our own words, each with its
 * public source, embedded for retrieval. Loaded by `npm run kb:load -w api`.
 */
export const knowledgeNotes = pgTable(
  'knowledge_notes',
  {
    id: text('id').primaryKey(),
    area: text('area').notNull(),
    title: text('title').notNull(),
    body: text('body').notNull(),
    sourceName: text('source_name').notNull(),
    sourceUrl: text('source_url').notNull(),
    tags: text('tags').array().notNull(),
    embedding: vector('embedding', { dimensions: 768 }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('knowledge_notes_embedding_idx').using('hnsw', t.embedding.op('vector_cosine_ops'))],
);

/** One coach conversation per area at a time. Starting over makes a new one. */
export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  area: text('area').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull().defaultNow(),
});

export interface ProposedStep {
  title: string;
  why: string;
  targetCount: number;
}

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  /** coach, user, or notice (a safety message written by code, not the model). */
  role: text('role').notNull(),
  /** For notices: crisis or drift. Lets the coach know a crisis notice was shown recently. */
  noticeKind: text('notice_kind'),
  content: text('content').notNull(),
  noteIds: text('note_ids').array().notNull().default([]),
  proposedStep: jsonb('proposed_step').$type<ProposedStep | null>(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** A small step the person agreed to try, counted, never dated. */
export const steps = pgTable('steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  area: text('area').notNull(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  why: text('why').notNull(),
  noteIds: text('note_ids').array().notNull().default([]),
  targetCount: integer('target_count').notNull(),
  doneCount: integer('done_count').notNull().default(0),
  /** active, done, or dropped. */
  status: text('status').notNull().default('active'),
  /** After finishing: did it help? yes, a-bit, or no. Null until asked. */
  helped: text('helped'),
  /** After finishing: continued (a bigger rung was started), closed (enough for now), or null while the question is open. */
  followUp: text('follow_up'),
  /** The step this one continues, when it is a higher rung of the same step. */
  parentStepId: uuid('parent_step_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const stepLogs = pgTable('step_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  stepId: uuid('step_id').notNull().references(() => steps.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type KnowledgeNote = typeof knowledgeNotes.$inferSelect;
export type Step = typeof steps.$inferSelect;
