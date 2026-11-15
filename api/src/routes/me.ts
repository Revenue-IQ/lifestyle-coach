import { ABOUT_YOU_FIELD_IDS, CRISIS_CARD, flagsFor, looksLikeCrisis } from '@wellbeing/shared';
import { and, desc, eq, isNull, or } from 'drizzle-orm';
import { Hono } from 'hono';
import { aiEnabled } from '../ai/gemini';
import type { AuthVariables } from '../auth';
import { GAME } from '../config/game';
import { db } from '../db/client';
import { baselineCheckins, complaintSnapshots, steps, todayCheckins, type User } from '../db/schema';
import { standingFor } from '../game/award';
import { areaStandings } from './areas';
import { presentStep } from './coach';

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
  const latestComplaints = await db.query.complaintSnapshots.findFirst({
    where: eq(complaintSnapshots.userId, user.id),
    orderBy: desc(complaintSnapshots.createdAt),
  });
  const [standing, latestBaseline, todayCount, areas, activeSteps] = await Promise.all([
    standingFor(user.id),
    db.query.baselineCheckins.findFirst({
      where: eq(baselineCheckins.userId, user.id),
      orderBy: desc(baselineCheckins.createdAt),
    }),
    db.$count(todayCheckins, eq(todayCheckins.userId, user.id)),
    areaStandings(user.id, latestComplaints?.complaintIds ?? []),
    db.query.steps.findMany({
      // Active steps, plus finished ones whose "did it help / keep going?" question is still open.
      where: and(eq(steps.userId, user.id), or(eq(steps.status, 'active'), and(eq(steps.status, 'done'), isNull(steps.followUp)))),
      orderBy: desc(steps.createdAt),
    }),
  ]);
  return c.json({
    profile: {
      name: user.name,
      over18: user.over18,
      age: user.age,
      sex: user.sex,
      weightKg: user.weightKg,
      activityLevel: user.activityLevel,
      pregnantOrBreastfeeding: user.pregnantOrBreastfeeding,
      conditions: user.conditions,
    },
    steps: activeSteps.map(presentStep),
    coachEnabled: aiEnabled(),
    /**
     * A plain notice when the person's own stored words (latest free text, conditions)
     * carry crisis language. Shown at the top of home until the words change.
     */
    safetyNotice: looksLikeCrisis(latestComplaints?.freeText) || looksLikeCrisis(user.conditions) ? CRISIS_CARD : null,
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
    /** Flags the latest cards carry (mood, gut). Home uses "mood" to put the two-week check-in first. */
    complaintFlags: flagsFor(latestComplaints?.complaintIds ?? []),
    todayCount,
    areas,
    game: {
      todayPoints: GAME.points.today,
      todayCapPerDay: GAME.caps.today.perDay,
      areaCheckinPoints: GAME.points['area-checkin'],
      stepLogPoints: GAME.points['step-log'],
      stepDonePoints: GAME.points['step-done'],
    },
  });
});
