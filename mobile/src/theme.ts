import type { AreaId } from '@wellbeing/shared';

/** One colour per life area, used for the "where to look first" card and progress. */
export const AREA_COLORS: Record<AreaId, { main: string; soft: string }> = {
  sleep: { main: '#4F46E5', soft: '#E0E7FF' },
  diet: { main: '#D97706', soft: '#FEF3C7' },
  gut: { main: '#0D9488', soft: '#CCFBF1' },
  movement: { main: '#E11D48', soft: '#FFE4E6' },
  emotions: { main: '#7C3AED', soft: '#EDE9FE' },
};

export const colors = {
  paper: '#FBF8F3',
  ink: '#1F2933',
  muted: '#6B7280',
  line: '#E7E2DA',
  accent: '#2F855A',
};
