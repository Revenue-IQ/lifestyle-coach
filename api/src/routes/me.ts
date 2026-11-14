import { ABOUT_YOU_FIELD_IDS } from '@wellbeing/shared';
import { desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { AuthVariables } from '../auth';
import { GAME } from '../config/game';
import { db } from '../db/client';
import { baselineCheckins, complaintSnapshots, todayCheckins, type User } from '../db/schema';
import { standingFor } from '../game/award';

export interface Quest {
  id: 'name' | 'baseline' | 'about-you' | 'complaints';
  title: string;
  /** Why, and what gets better in the app. */
  payoff: string;
  points: number;
}

/** Up to three invitations, in priority order. Ignoring them costs nothing. */
export function questsFor(user: User, hasBaseline: boolean, hasComplaints: boolean): Quest[] {
  const quests: Quest[] = [];
  if (!hasComplaints) {
    quests.push({
      id: 'complaints',
      title: "Tell us what's bugging you",
      payoff: 'We work out where to look first.',
      points: GAME.points.complaints,
    });
  }
  if (!user.name) {
    quests.push({
      id: 'name',
      title: 'Pick a name',
      payoff: 'So we have something to call you. Any name will do.',
      points: GAME.points.name,
    });
  }
  if (!hasBaseline) {
    quests.push({
      id: 'baseline',
      title: 'Two-week check-in',
      payoff: 'Five quick questions give your starting score, so later we can show it moving.',
      points: GAME.points.baseline,
    });
  }
  const missing = ABOUT_YOU_FIELD_IDS.filter((f) => user[f] === null || user[f] === undefined);
  if (missing.length > 0) {
    quests.push({
      id: 'about-you',
      title: 'A bit about you',
      payoff: `${missing.length} optional ${missing.length === 1 ? 'detail' : 'details'} that make your ratings sharper.`,
      points: GAME.points['profile-field'] * missing.length,
    });
  }
  return quests.slice(0, 3);
}

export const me = new Hono<{ Variables: AuthVariables }>().get('/', async (c) => {
  const user = c.get('user');
  const [standing, latestBaseline, latestComplaints, todayCount] = await Promise.all([
    standingFor(user.id),
    db.query.baselineCheckins.findFirst({
      where: eq(baselineCheckins.userId, user.id),
      orderBy: desc(baselineCheckins.createdAt),
    }),
    db.query.complaintSnapshots.findFirst({
      where: eq(complaintSnapshots.userId, user.id),
      orderBy: desc(complaintSnapshots.createdAt),
    }),
    db.$count(todayCheckins, eq(todayCheckins.userId, user.id)),
  ]);
  return c.json({
    profile: {
      name: user.name,
      over18: user.over18,
      age: user.age,
      sex: user.sex,
      weightKg: user.weightKg,
      activityLevel: user.activityLevel,
    },
    standing,
    quests: questsFor(user, !!latestBaseline, !!latestComplaints),
    latestBaseline: latestBaseline
      ? { score: latestBaseline.score, createdAt: latestBaseline.createdAt.toISOString() }
      : null,
    latestComplaints: latestComplaints
      ? {
          complaintIds: latestComplaints.complaintIds,
          freeText: latestComplaints.freeText,
          createdAt: latestComplaints.createdAt.toISOString(),
        }
      : null,
    todayCount,
    game: { todayPoints: GAME.points.today, todayCapPerDay: GAME.caps.today.perDay },
  });
});
