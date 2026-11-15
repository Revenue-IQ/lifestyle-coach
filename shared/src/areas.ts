/**
 * The six life areas the app looks at. Downtime (rest, boundaries, time of your
 * own) was added on 2026-11-15 from the teammates' buildathon material. They are levers, things a person does;
 * the WHO-5 baseline measures the outcome. Order is the display order.
 * Emotions was replaced by Social belonging on 2026-11-14 (docs/features/area-ratings.md).
 */
export const AREAS = ['sleep', 'diet', 'movement', 'gut', 'social', 'downtime'] as const;
export type AreaId = (typeof AREAS)[number];

export const AREA_LABELS: Record<AreaId, string> = {
  sleep: 'Sleep',
  diet: 'Food', // id stays "diet"; the label became Food on 2026-11-15
  movement: 'Movement',
  gut: 'Gut health',
  social: 'Social belonging',
  downtime: 'Downtime',
};

/** One line under the area name, shown on its page and in the ranked list. */
export const AREA_BLURBS: Record<AreaId, string> = {
  sleep: 'How much, how regular, and whether it actually restores you.',
  diet: 'What a normal day of eating looks like. No calorie counting.',
  movement: 'Sitting, walking, getting out of breath, and lifting things.',
  gut: 'Digestion, regularity, and the variety your gut bugs get.',
  social: 'Real contact with people, and whether you have someone to call.',
  downtime: 'Rest, boundaries, and time that is actually yours.',
};

export function isAreaId(value: string): value is AreaId {
  return (AREAS as readonly string[]).includes(value);
}
