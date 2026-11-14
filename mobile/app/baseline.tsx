import {
  WHO5_ATTRIBUTION,
  WHO5_INTRO,
  WHO5_QUESTIONS,
  WHO5_SCALE,
  type Who5Answers,
} from '@wellbeing/shared';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSubmitBaseline } from '@/api/hooks';
import type { BaselineResult } from '@/api/client';
import { useAppAuth } from '@/auth';
import { Body, Button, Card, ErrorText, Loading, Screen, Small, Subtitle, Title } from '@/components/ui';

/**
 * The two-week baseline: WHO-5, one question at a time, scored by the backend.
 * See docs/features/wellbeing-check-in.md.
 */
export default function Baseline() {
  const { isLoaded, isSignedIn } = useAppAuth();
  const submit = useSubmitBaseline();
  const [answers, setAnswers] = useState<(number | null)[]>(Array(WHO5_QUESTIONS.length).fill(null));
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<(BaselineResult & { quietPoints: number }) | null>(null);

  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <Redirect href="/" />;

  if (result) return <Result result={result} />;

  const last = step === WHO5_QUESTIONS.length - 1;
  const current = answers[step];
  const complete = answers.every((a) => a !== null);

  const choose = (v: number) => {
    const next = [...answers];
    next[step] = v;
    setAnswers(next);
    if (!last) setTimeout(() => setStep(step + 1), 150);
  };

  const finish = async () => {
    const data = await submit.mutateAsync(answers as Who5Answers);
    setResult({ ...data.checkin, quietPoints: data.checkin.band === 'professional' ? data.award.points : 0 });
  };

  return (
    <Screen
      footer={
        <View>
          {last ? (
            <Button title="See my score" onPress={finish} disabled={!complete} loading={submit.isPending} />
          ) : (
            <Button title="Next" onPress={() => setStep(step + 1)} disabled={current === null} />
          )}
          <Button title={step === 0 ? 'Not now' : 'Back'} variant="secondary" className="mt-2" onPress={() => (step === 0 ? router.back() : setStep(step - 1))} />
          <ErrorText error={submit.error} />
        </View>
      }
    >
      <Small className="mb-2">
        {step + 1} of {WHO5_QUESTIONS.length}
      </Small>
      <Title>Two-week check-in</Title>
      <Subtitle>
        Five quick questions give you a wellbeing score out of 100. It's your starting line, so later we can show it moving. Answer for the last two weeks, not just today.
      </Subtitle>

      <Text className="mb-1 font-sans text-base text-muted">{WHO5_INTRO}</Text>
      <Text className="mb-5 font-semibold text-2xl leading-snug text-ink">{WHO5_QUESTIONS[step]}</Text>

      {WHO5_SCALE.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="button"
          accessibilityState={{ selected: current === o.value }}
          onPress={() => choose(o.value)}
          className={`mb-2 min-h-[52px] justify-center rounded-2xl border px-4 py-3 ${
            current === o.value ? 'border-ink bg-ink' : 'border-line bg-card active:bg-paper'
          }`}
        >
          <Text className={`font-medium text-base ${current === o.value ? 'text-white' : 'text-ink'}`}>{o.label}</Text>
        </Pressable>
      ))}

      <Small className="mt-4">{WHO5_ATTRIBUTION}</Small>
    </Screen>
  );
}

function Result({ result }: { result: BaselineResult & { quietPoints: number } }) {
  const professional = result.band === 'professional';
  return (
    <Screen footer={<Button title="Back home" onPress={() => router.replace('/home')} />}>
      {professional ? (
        <Card className="mb-6 border-warn bg-warnSoft">
          <Text className="mb-2 font-semibold text-lg text-ink">A word first</Text>
          <Body>{result.message}</Body>
        </Card>
      ) : null}

      <Title>Your starting line</Title>
      <View className="mb-4 flex-row items-end">
        <Text className="font-bold text-6xl text-ink">{result.score}</Text>
        <Small className="mb-3 ml-2">out of 100</Small>
      </View>
      {!professional ? <Body className="mb-6">{result.message}</Body> : null}
      <Small>
        Saved on {new Date(result.createdAt).toLocaleDateString()}. Redo it any time from home; every one is kept, so you can see the line move.
        {result.quietPoints > 0 ? ` ${result.quietPoints} points added to your total for the check-in.` : ''}
      </Small>
    </Screen>
  );
}
