import { AREA_LABELS } from '@wellbeing/shared';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import type { StepItem } from '../api/client';
import { useCloseStep, useContinueStep, useDropStep, useLogStep, useReflectStep } from '../api/hooks';
import { AREA_COLORS } from '../theme';
import { Button, Card, ErrorText, Small } from './ui';

/**
 * One step: title, why, progress dots, "Did it" and a quiet way to drop it.
 * When a rung is finished the same card asks "did it help?" and offers the
 * next rung, the coach, or enough for now.
 */
export function StepCard({ step, showArea, points }: { step: StepItem; showArea?: boolean; points: number }) {
  const log = useLogStep();
  const drop = useDropStep();
  const colour = AREA_COLORS[step.area];
  const done = step.status === 'done';

  return (
    <Card className="mb-2">
      {showArea ? (
        <View className="mb-1 flex-row items-center">
          <View className="mr-2 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: colour.main }} />
          <Small>{AREA_LABELS[step.area]}</Small>
        </View>
      ) : null}
      <Text className="font-semibold text-base text-ink">{step.title}</Text>
      {!done && step.why ? <Small className="mt-1">{step.why}</Small> : null}
      <View className="mt-3 flex-row flex-wrap items-center">
        {Array.from({ length: step.targetCount }, (_, i) => (
          <View
            key={i}
            className="mb-1 mr-1.5 h-3 w-3 rounded-full"
            style={{ backgroundColor: i < step.doneCount ? colour.main : colour.soft }}
          />
        ))}
        <Small className="mb-1 ml-1">
          {step.doneCount} of {step.targetCount}
          {step.rung > 1 ? ` · rung ${step.rung}` : ''}
          {done ? ' · done' : ''}
        </Small>
      </View>

      {!done ? (
        <View className="mt-3 flex-row items-center justify-between">
          <Button title={`Did it · +${points}`} onPress={() => log.mutate(step.id)} loading={log.isPending} className="flex-1" />
          <Pressable accessibilityRole="button" onPress={() => drop.mutate(step.id)} disabled={drop.isPending} className="ml-3 px-2 py-3">
            <Small>Drop it</Small>
          </Pressable>
        </View>
      ) : (
        <FollowUp step={step} />
      )}
      <ErrorText error={log.error ?? drop.error} />
    </Card>
  );
}

const HELPED_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'a-bit', label: 'A bit' },
  { value: 'no', label: 'Not really' },
] as const;

/** The two questions after a finished rung: did it help, and what next. No humour here. */
function FollowUp({ step }: { step: StepItem }) {
  const reflect = useReflectStep();
  const cont = useContinueStep();
  const close = useCloseStep();
  const busy = reflect.isPending || cont.isPending || close.isPending;

  if (!step.helped) {
    return (
      <View className="mt-3">
        <Text className="mb-2 font-semibold text-base text-ink">You did it {step.targetCount} times. Did it help?</Text>
        <View className="flex-row gap-2">
          {HELPED_OPTIONS.map((o) => (
            <Pressable
              key={o.value}
              accessibilityRole="button"
              disabled={busy}
              onPress={() => reflect.mutate({ stepId: step.id, helped: o.value })}
              className="min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-line bg-paper active:bg-card"
            >
              <Text className="font-medium text-base text-ink">{o.label}</Text>
            </Pressable>
          ))}
        </View>
        <Small className="mt-2">An honest answer is worth more to the coach than a kind one.</Small>
        <ErrorText error={reflect.error} />
      </View>
    );
  }

  const helpedLine =
    step.helped === 'no'
      ? 'Fair enough. Not every step fits, and knowing that is useful. The coach can suggest a different lever.'
      : step.nextTarget
        ? `Good. The first ${step.targetCount} were the trial; the next ${step.nextTarget} are where it starts to stick.`
        : 'That is a habit now. Genuinely well done.';

  return (
    <View className="mt-3">
      <Small className="mb-3">{helpedLine}</Small>
      {step.helped !== 'no' && step.nextTarget ? (
        <Button title={`Keep going · ${step.nextTarget} times`} onPress={() => cont.mutate({ stepId: step.id })} loading={cont.isPending} />
      ) : null}
      <View className="mt-2 flex-row gap-2">
        <View className="flex-1">
          <Link href={{ pathname: '/areas/[area]/coach', params: { area: step.area } }} asChild>
            <Button title="Talk to the coach" variant="secondary" />
          </Link>
        </View>
        <View className="flex-1">
          <Button title="Enough for now" variant="secondary" onPress={() => close.mutate({ stepId: step.id })} loading={close.isPending} />
        </View>
      </View>
      <ErrorText error={cont.error ?? close.error} />
    </View>
  );
}
