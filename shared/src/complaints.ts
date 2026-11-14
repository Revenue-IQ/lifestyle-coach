import { AREAS, type AreaId } from './areas';

/**
 * The "What's bugging you" list and its fixed mapping to life areas.
 * See docs/features/whats-bugging-you.md. The mapping is deliberately a
 * static table: the card must appear instantly, before login and without AI.
 */
export interface Complaint {
  id: string;
  label: string;
  /** The area that gets 2 points. Null for "not sure", which lights nothing. */
  primary: AreaId | null;
  /** Areas that get 1 point each. */
  also: AreaId[];
}

export const COMPLAINTS: Complaint[] = [
  { id: 'tired-all-the-time', label: 'Tired all the time', primary: 'sleep', also: ['diet', 'movement'] },
  { id: 'trouble-falling-asleep', label: 'Trouble falling asleep', primary: 'sleep', also: ['emotions'] },
  { id: 'wake-up-tired', label: 'Wake up tired', primary: 'sleep', also: ['diet'] },
  { id: 'bloated', label: 'Bloated or stomach trouble', primary: 'gut', also: ['diet'] },
  { id: 'snacking', label: "Snacking I can't stop", primary: 'diet', also: ['sleep', 'emotions'] },
  { id: 'low-mood', label: 'Low mood', primary: 'emotions', also: ['sleep', 'movement'] },
  { id: 'anxious', label: 'Anxious or wound up', primary: 'emotions', also: ['sleep', 'gut'] },
  { id: 'no-energy-to-move', label: 'No energy to move', primary: 'movement', also: ['diet', 'sleep'] },
  { id: 'brain-fog', label: "Brain fog, can't focus", primary: 'sleep', also: ['diet', 'gut'] },
  { id: 'not-sure', label: "Not sure, something's off", primary: null, also: [] },
];

export const COMPLAINT_IDS = COMPLAINTS.map((c) => c.id);
export const NOT_SURE_ID = 'not-sure';

export const PRIMARY_POINTS = 2;
export const ALSO_POINTS = 1;

export interface AreaRanking {
  area: AreaId;
  score: number;
  /** Labels of the complaints that contributed to this area, in list order. */
  from: string[];
}

/** Ranks the five areas by how strongly the chosen complaints point at them. */
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
    (x, y) => y.score - x.score || AREAS.indexOf(x.area) - AREAS.indexOf(y.area),
  );
}

/** The areas worth lighting up: anything with a score, at most three. */
export function litAreas(complaintIds: string[]): AreaRanking[] {
  return rankAreas(complaintIds).filter((r) => r.score > 0).slice(0, 3);
}
