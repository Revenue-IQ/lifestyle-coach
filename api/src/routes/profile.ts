import { zValidator } from '@hono/zod-validator';
import { ACTIVITY_OPTIONS, CRISIS_CARD, looksLikeCrisis, PROFILE_FIELDS, SEX_OPTIONS } from '@wellbeing/shared';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AuthVariables } from '../auth';
import { db } from '../db/client';
import { users } from '../db/schema';
import { award, type Award } from '../game/award';

const sexValues = SEX_OPTIONS.map((o) => o.value) as [string, ...string[]];
const activityValues = ACTIVITY_OPTIONS.map((o) => o.value) as [string, ...string[]];

/** Every field optional; null clears it. Editing never removes points. */
const patchSchema = z.object({
  name: z.string().trim().min(1).max(PROFILE_FIELDS.name.maxLength).optional(),
  over18: z.boolean().nullable().optional(),
  age: z.number().int().min(PROFILE_FIELDS.age.min).max(PROFILE_FIELDS.age.max).nullable().optional(),
  sex: z.enum(sexValues).nullable().optional(),
  weightKg: z.number().min(PROFILE_FIELDS.weightKg.min).max(PROFILE_FIELDS.weightKg.max).nullable().optional(),
  activityLevel: z.enum(activityValues).nullable().optional(),
  /** Safety gates, asked before the first coach session. */
  pregnantOrBreastfeeding: z.boolean().nullable().optional(),
  conditions: z.string().trim().max(500).nullable().optional(),
});

export const profile = new Hono<{ Variables: AuthVariables }>().patch(
  '/',
  zValidator('json', patchSchema),
  async (c) => {
    const user = c.get('user');
    const patch = c.req.valid('json');

    const [updated] = await db
      .update(users)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(users.id, user.id))
      .returning();

    // Points for each field filled in for the first time. Once per field, ever.
    const awards: Award[] = [];
    if (patch.name !== undefined && !user.name) awards.push(await award(user.id, 'name'));
    for (const field of ['age', 'sex', 'weightKg', 'activityLevel'] as const) {
      const value = patch[field];
      if (value !== undefined && value !== null && (user[field] === null || user[field] === undefined)) {
        awards.push(await award(user.id, 'profile-field', field));
      }
    }
    const earned = awards.filter((a) => !a.capped);
    const last = awards.at(-1);
    const summary = last
      ? {
          ...last,
          points: earned.reduce((s, a) => s + a.points, 0),
          reason: earned.length > 1 ? 'for details about you' : last.reason,
          leveledUp: awards.some((a) => a.leveledUp),
        }
      : null;

    return c.json({
      profile: {
        name: updated.name,
        over18: updated.over18,
        age: updated.age,
        sex: updated.sex,
        weightKg: updated.weightKg,
        activityLevel: updated.activityLevel,
        pregnantOrBreastfeeding: updated.pregnantOrBreastfeeding,
        conditions: updated.conditions,
      },
      award: summary,
      /** Plain notice when the conditions line carried crisis language. */
      notice: patch.conditions !== undefined && looksLikeCrisis(patch.conditions) ? CRISIS_CARD : null,
    });
  },
);
