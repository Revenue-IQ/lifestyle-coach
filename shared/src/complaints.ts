import { AREAS, type AreaId } from './areas';

/**
 * The first screen's cards and their fixed mapping to life areas.
 * See docs/features/whats-bugging-you.md. The mapping is deliberately a
 * static table: the card must appear instantly, before login and without AI.
 *
 * Two rounds since 2026-11-15: round 1 is how the person has been feeling
 * (outcomes), round 2 is what their days are like (the levers). The list and
 * the shape of the mapping came from a teammate's cards.json. Its Downtime
 * cards pointed at sleep, movement and social until the Downtime area was
 * added on 2026-11-15; now they point there first.
 */
export type ComplaintFlag = 'mood' | 'gut';

export interface Complaint {
  id: string;
  label: string;
  round: 1 | 2;
  /** The area that gets 2 points. Null for "not sure", which lights nothing. */
  primary: AreaId | null;
  /** Areas that get 1 point each. */
  also: AreaId[];
  /** Something the result screen or the coach should know, beyond the mapping. */
  flag?: ComplaintFlag;
  /** Cards from the original list. Still ranked for stored answers, no longer offered. */
  hidden?: boolean;
}

export const NOT_SURE_ID = 'not-sure';

export const ROUNDS = [
  { round: 1 as const, title: 'How have you been feeling?', subtitle: 'Tap everything that feels like you. No account needed for this bit.' },
  { round: 2 as const, title: 'What are your days like?', subtitle: "No judgment. Tap whatever's true." },
];

export const COMPLAINTS: Complaint[] = [
  // Round 1: how have you been feeling?
  { id: 'r1_tired', label: 'Tired all the time', round: 1, primary: 'sleep', also: ['diet', 'movement'] },
  { id: 'r1_sleep', label: "Can't sleep well", round: 1, primary: 'sleep', also: ['movement'] },
  { id: 'r1_worried', label: 'Stressed or worried a lot', round: 1, primary: 'downtime', also: ['sleep', 'movement'] },
  { id: 'r1_focus', label: 'Hard to focus', round: 1, primary: 'sleep', also: ['diet'] },
  { id: 'r1_stomach', label: 'Bloated or upset stomach', round: 1, primary: 'gut', also: ['diet'], flag: 'gut' },
  { id: 'r1_low', label: 'Feeling low', round: 1, primary: 'social', also: ['sleep', 'movement'], flag: 'mood' },
  { id: 'r1_nofun', label: 'Nothing feels fun anymore', round: 1, primary: 'social', also: ['movement', 'sleep'], flag: 'mood' },
  { id: 'r1_lonely', label: 'Feeling lonely', round: 1, primary: 'social', also: ['movement'] },
  { id: 'r1_annoyed', label: 'Easily annoyed', round: 1, primary: 'sleep', also: ['downtime', 'social'] },
  { id: 'r1_dread', label: 'Dread going to work', round: 1, primary: 'downtime', also: ['social', 'sleep'] },
  { id: NOT_SURE_ID, label: "Not sure, something's just off", round: 1, primary: null, also: [] },
  // Round 2: what are your days like?
  { id: 'r2_phone', label: 'On my phone late at night', round: 2, primary: 'sleep', also: [] },
  { id: 'r2_sitting', label: 'Sitting most of the day', round: 2, primary: 'movement', also: ['sleep'] },
  { id: 'r2_skipmeals', label: 'Skip meals or eat late', round: 2, primary: 'diet', also: ['gut', 'sleep'] },
  { id: 'r2_rush', label: 'Eat in a rush or at my desk', round: 2, primary: 'gut', also: ['diet'] },
  { id: 'r2_caffeine', label: 'Lots of coffee or sugar', round: 2, primary: 'diet', also: ['sleep'] },
  { id: 'r2_worknonstop', label: 'Work never really stops', round: 2, primary: 'downtime', also: ['sleep'] },
  { id: 'r2_notime', label: 'No time for myself', round: 2, primary: 'downtime', also: ['movement', 'social'] },
  { id: 'r2_friends', label: 'Rarely see friends', round: 2, primary: 'social', also: [] },
  { id: 'r2_outside', label: 'Hardly get outside', round: 2, primary: 'movement', also: ['sleep'] },
  { id: 'r2_weekend', label: 'I live for the weekend', round: 2, primary: 'downtime', also: ['social'] },
  { id: 'r2_drink', label: 'A drink helps me relax', round: 2, primary: 'downtime', also: ['sleep', 'gut'] },
  // The original list (Phase 1), kept so answers already stored keep their picture.
  { id: 'tired-all-the-time', label: 'Tired all the time', round: 1, primary: 'sleep', also: ['diet', 'movement'], hidden: true },
  { id: 'trouble-falling-asleep', label: 'Trouble falling asleep', round: 1, primary: 'sleep', also: ['movement'], hidden: true },
  { id: 'wake-up-tired', label: 'Wake up tired', round: 1, primary: 'sleep', also: ['diet'], hidden: true },
  { id: 'bloated', label: 'Bloated or stomach trouble', round: 1, primary: 'gut', also: ['diet'], flag: 'gut', hidden: true },
  { id: 'snacking', label: "Snacking I can't stop", round: 1, primary: 'diet', also: ['sleep', 'gut'], hidden: true },
  { id: 'low-mood', label: 'Low mood', round: 1, primary: 'social', also: ['sleep', 'movement'], flag: 'mood', hidden: true },
  { id: 'anxious', label: 'Anxious or wound up', round: 1, primary: 'sleep', also: ['gut', 'social'], hidden: true },
  { id: 'no-energy-to-move', label: 'No energy to move', round: 1, primary: 'movement', also: ['diet', 'sleep'], hidden: true },
  { id: 'brain-fog', label: "Brain fog, can't focus", round: 1, primary: 'sleep', also: ['diet', 'gut'], hidden: true },
  { id: 'lonely', label: 'Mostly on my own', round: 1, primary: 'social', also: ['movement'], hidden: true },
];

export const COMPLAINT_IDS = COMPLAINTS.map((c) => c.id);

/** The cards offered in one round, in order. */
export function cardsForRound(round: 1 | 2): Complaint[] {
  return COMPLAINTS.filter((c) => c.round === round && !c.hidden && c.id !== NOT_SURE_ID);
}

export const PRIMARY_POINTS = 2;
export const ALSO_POINTS = 1;

/**
 * Where to start when the evidence is equal: sleep is the most upstream lever
 * in the notes, then downtime, food, gut, movement, social. Also the home screen's tiebreak.
 */
export const START_ORDER: AreaId[] = ['sleep', 'downtime', 'diet', 'gut', 'movement', 'social'];

export interface AreaRanking {
  area: AreaId;
  score: number;
  /** Labels of the complaints that contributed to this area, in list order. */
  from: string[];
}

/** Ranks the five areas by how strongly the chosen cards point at them. */
export function rankAreas(complaintIds: string[]): AreaRanking[] {
  const chosen = new Set(complaintIds);
  const scores = new Map<AreaId, AreaRanking>(
    AREAS.map((a) => [a, { area: a, score: 0, from: [] }]),
  );
  for (const c of COMPLAINTS) {
    if (!chosen.has(c.id)) continue;
    if (c.primary) {
      const r = scores.get(c.primary)!;
      r.score += PRIMARY_POINTS;
      r.from.push(c.label);
    }
    for (const a of c.also) {
      const r = scores.get(a)!;
      r.score += ALSO_POINTS;
      r.from.push(c.label);
    }
  }
  return [...scores.values()].sort(
    (x, y) => y.score - x.score || START_ORDER.indexOf(x.area) - START_ORDER.indexOf(y.area),
  );
}

/** The areas worth lighting up on the first card: anything with a score, at most three. */
export function litAreas(complaintIds: string[]): AreaRanking[] {
  return rankAreas(complaintIds).filter((r) => r.score > 0).slice(0, 3);
}

/** The flags the chosen cards carry, each once. */
export function flagsFor(complaintIds: string[]): ComplaintFlag[] {
  const chosen = new Set(complaintIds);
  const flags = new Set<ComplaintFlag>();
  for (const c of COMPLAINTS) if (chosen.has(c.id) && c.flag) flags.add(c.flag);
  return [...flags];
}

/** Labels for stored ids, in list order, unknown ids dropped. */
export function complaintLabels(complaintIds: string[]): string[] {
  const chosen = new Set(complaintIds);
  return COMPLAINTS.filter((c) => chosen.has(c.id)).map((c) => c.label);
}
