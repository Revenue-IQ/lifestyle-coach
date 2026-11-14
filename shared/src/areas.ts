/**
 * The five life areas the app looks at. They are levers, things a person does;
 * the WHO-5 baseline measures the outcome. Order is the display order.
 * Emotions was replaced by Social belonging on 2026-11-14 (docs/features/area-ratings.md).
 */
export const AREAS = ['sleep', 'diet', 'movement', 'gut', 'social'] as const;
export type AreaId = (typeof AREAS)[number];

export const AREA_LABELS: Record<AreaId, string> = {
  sleep: 'Sleep',
  diet: 'Diet',
  movement: 'Movement',
  gut: 'Gut health',
  social: 'Social belonging',
};

/** One line under the area name, shown on its page and in the ranked list. */
export const AREA_BLURBS: Record<AreaId, string> = {
  sleep: 'How much, how regular, and whether it actually restores you.',
  diet: 'What a normal day of eating looks like. No calorie counting.',
  movement: 'Sitting, walking, getting out of breath, and lifting things.',
  gut: 'Digestion, regularity, and the variety your gut bugs get.',
  social: 'Real contact with people, and whether you have someone to call.',
};

export function isAreaId(value: string): value is AreaId {
  return (AREAS as readonly string[]).includes(value);
}
