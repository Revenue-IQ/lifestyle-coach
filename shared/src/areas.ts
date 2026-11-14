/** The five life areas the app looks at. Order is the display order. */
export const AREAS = ['sleep', 'diet', 'gut', 'movement', 'emotions'] as const;
export type AreaId = (typeof AREAS)[number];

export const AREA_LABELS: Record<AreaId, string> = {
  sleep: 'Sleep',
  diet: 'Diet',
  gut: 'Gut health',
  movement: 'Movement',
  emotions: 'Emotions',
};
