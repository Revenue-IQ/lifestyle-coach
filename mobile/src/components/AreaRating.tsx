import { AREA_BAND_LABELS, type AreaBand, type AreaId } from '@wellbeing/shared';
import { Text, View } from 'react-native';
import { AREA_COLORS, BAND_COLORS } from '../theme';
import { Small } from './ui';

/** The band as a small coloured pill. */
export function BandPill({ band, rough }: { band: AreaBand; rough?: boolean }) {
  const c = BAND_COLORS[band];
  return (
    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: c.soft }}>
      <Text className="font-medium text-xs" style={{ color: c.main }}>
        {AREA_BAND_LABELS[band]}
        {rough ? ' · rough' : ''}
      </Text>
    </View>
  );
}

/** A thin bar showing the score out of 100 in the area's colour. */
export function ScoreBar({ area, score }: { area: AreaId; score: number }) {
  return (
    <View className="mt-2 h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: AREA_COLORS[area].soft }}>
      <View className="h-2 rounded-full" style={{ width: `${Math.max(2, Math.min(100, score))}%`, backgroundColor: AREA_COLORS[area].main }} />
    </View>
  );
}

/** The gaps as short lines, or a kind line when there are none. */
export function GapList({ gaps }: { gaps: string[] }) {
  if (gaps.length === 0) return <Small>No obvious gaps from your answers. Nice.</Small>;
  return (
    <View>
      {gaps.map((g) => (
        <View key={g} className="mb-1 flex-row">
          <Text className="mr-2 font-sans text-sm text-muted">•</Text>
          <Small className="flex-1">{capitalise(g)}</Small>
        </View>
      ))}
    </View>
  );
}

export function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
