import { and, count, eq, gte, sql } from 'drizzle-orm';
import { GAME, type AwardKind } from '../config/game';
import { db } from '../db/client';
import { pointsLedger } from '../db/schema';
import { decideAward, levelFor, pointsToNextLevel, startOfUtcDay } from './rules';

export interface Standing {
  total: number;
  level: number;
  next: { nextLevel: number; needed: number } | null;
}

export interface Award extends Standing {
  points: number;
  reason: string;
  capped: boolean;
  leveledUp: boolean;
}

export async function standingFor(userId: string): Promise<Standing> {
  const [row] = await db
    .select({ total: sql<number>`coalesce(sum(${pointsLedger.points}), 0)::int` })
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, userId));
  const total = row?.total ?? 0;
  return { total, level: levelFor(total), next: pointsToNextLevel(total) };
}

async function alreadyAwarded(userId: string, kind: AwardKind, refId?: string): Promise<number> {
  const cap = GAME.caps[kind];
  const conditions = [
    eq(pointsLedger.userId, userId),
    eq(pointsLedger.kind, kind),
    sql`${pointsLedger.points} > 0`,
  ];
  if ('once' in cap) {
    if (refId) conditions.push(eq(pointsLedger.refId, refId));
  } else {
    conditions.push(gte(pointsLedger.createdAt, startOfUtcDay()));
    if ('perRef' in cap && cap.perRef && refId) conditions.push(eq(pointsLedger.refId, refId));
  }
  const [row] = await db.select({ n: count() }).from(pointsLedger).where(and(...conditions));
  return row?.n ?? 0;
}

/**
 * Records a contribution in the ledger and returns what it earned plus the new
 * standing. A capped contribution writes no ledger row: the entry itself is still
 * stored in its own table, it just earned nothing this time.
 */
export async function award(userId: string, kind: AwardKind, refId?: string): Promise<Award> {
  const before = await standingFor(userId);
  const decision = decideAward(kind, await alreadyAwarded(userId, kind, refId));
  if (!decision.capped) {
    await db.insert(pointsLedger).values({
      userId,
      kind,
      points: decision.points,
      reason: decision.reason,
      refId,
    });
  }
  const after = decision.capped ? before : await standingFor(userId);
  return {
    ...after,
    points: decision.points,
    reason: decision.reason,
    capped: decision.capped,
    leveledUp: after.level > before.level,
  };
}
