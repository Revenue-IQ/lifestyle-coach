import { AREA_LABELS, litAreas, NOT_SURE_ID } from '@wellbeing/shared';
import { Text, View } from 'react-native';
import { AREA_COLORS } from '../theme';
import { Body, Card, Small } from './ui';

/**
 * "Where to look first": the areas the chosen complaints point at, ranked.
 * Computed on the device from the shared mapping, so it works before login.
 */
export function AreaCard({ complaintIds, compact }: { complaintIds: string[]; compact?: boolean }) {
  const lit = litAreas(complaintIds);
  const onlyNotSure = lit.length === 0 && complaintIds.includes(NOT_SURE_ID);

  return (
    <Card>
      <Text className="mb-1 font-semibold text-lg text-ink">Where to look first</Text>
      {lit.length === 0 ? (
        <Body className="text-muted">
          {onlyNotSure
            ? 'Fair enough. "Not sure" is where most people start. The two-week check-in is the best next step: five questions, and a number to work from.'
            : 'Pick a complaint or two and we will light up the areas most often behind them.'}
        </Body>
      ) : (
        <View className="mt-2">
          {lit.map((r, i) => {
            const c = AREA_COLORS[r.area];
            const unique = [...new Set(r.from)];
            return (
              <View key={r.area} className="mb-3 flex-row items-start">
                <View className="mr-3 mt-0.5 h-9 w-9 items-center justify-center rounded-xl" style={{ backgroundColor: c.soft }}>
                  <Text className="font-bold text-base" style={{ color: c.main }}>{i + 1}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-base text-ink">{AREA_LABELS[r.area]}</Text>
                  {!compact ? <Small>From: {unique.join(', ')}</Small> : null}
                </View>
              </View>
            );
          })}
          {!compact ? (
            <Small className="mt-1">
              This is where we would start looking, not a diagnosis. The areas you log will sharpen it.
            </Small>
          ) : null}
        </View>
      )}
    </Card>
  );
}
