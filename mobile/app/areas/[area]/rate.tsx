import { AREA_LABELS, isAreaId, QUESTIONNAIRES, rateArea, type AreaAnswers, type AreaId } from '@wellbeing/shared';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import type { AreaCheckin } from '@/api/client';
import { useSubmitAreaCheckin } from '@/api/hooks';
import { useAppAuth } from '@/auth';
import { Ask } from '@/components/Ask';
import { BandPill, GapList, ScoreBar } from '@/components/AreaRating';
import { Body, Button, Card, ErrorText, Loading, Screen, Small, Subtitle, Title } from '@/components/ui';

/**
 * The "how it usually is" questionnaire for one area: one question per step,
 * every one skippable, scored by the backend when submitted.
 */
export default function RateArea() {
  const { area } = useLocalSearchParams<{ area: string }>();
  const { isLoaded, isSignedIn } = useAppAuth();

  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <Redirect href="/" />;
  if (!area || !isAreaId(area)) return <Redirect href="/home" />;

  return <Questionnaire area={area} />;
}

function Questionnaire({ area }: { area: AreaId }) {
  const q = QUESTIONNAIRES[area];
  const submit = useSubmitAreaCheckin(area);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AreaAnswers>({});
  const [result, setResult] = useState<AreaCheckin | null>(null);

  if (result) return <Result area={area} result={result} />;

  const question = q.questions[step];
  const last = step === q.questions.length - 1;
  const current = answers[question.id] ?? null;
  const answeredCount = Object.keys(answers).length;

  const setAnswer = (v: string | null) => {
    setAnswers((prev) => {
      const next = { ...prev };
      if (v === null) delete next[question.id];
      else next[question.id] = v;
      return next;
    });
    if (v !== null && !last) setTimeout(() => setStep(step + 1), 150);
  };

  const skip = () => {
    setAnswers((prev) => {
      const next = { ...prev };
      delete next[question.id];
      return next;
    });
    if (last) finish();
    else setStep(step + 1);
  };

  const finish = async () => {
    if (answeredCount === 0) {
      router.back();
      return;
    }
    const data = await submit.mutateAsync(answers);
    setResult(data.checkin);
  };

  return (
    <Screen
      footer={
        <View>
          {last ? (
            <Button
              title={answeredCount === 0 ? 'Nothing answered, go back' : 'See my rating'}
              onPress={finish}
              loading={submit.isPending}
            />
          ) : (
            <Button title="Next" onPress={() => setStep(step + 1)} disabled={current === null} />
          )}
          <View className="mt-2 flex-row gap-2">
            <View className="flex-1">
              <Button title={step === 0 ? 'Not now' : 'Back'} variant="secondary" onPress={() => (step === 0 ? router.back() : setStep(step - 1))} />
            </View>
            <View className="flex-1">
              <Button title={last ? 'Skip this one' : 'Skip'} variant="secondary" onPress={skip} />
            </View>
          </View>
          <ErrorText error={submit.error} />
        </View>
      }
    >
      <Small className="mb-2">
        {AREA_LABELS[area]} · {step + 1} of {q.questions.length} · all optional
      </Small>
      {step === 0 ? (
        <>
          <Title>How it usually is</Title>
          <Subtitle>{q.intro}</Subtitle>
        </>
      ) : null}
      <Ask key={question.id} field={question} value={current} onChange={setAnswer} />
    </Screen>
  );
}

function Result({ area, result }: { area: AreaId; result: AreaCheckin }) {
  const preview = rateArea(area, result.answers);
  return (
    <Screen
      footer={
        <View>
          <Button title={`Open ${AREA_LABELS[area]}`} onPress={() => router.replace({ pathname: '/areas/[area]', params: { area } })} />
          <Button title="Back home" variant="secondary" className="mt-2" onPress={() => router.replace('/home')} />
        </View>
      }
    >
      <Small className="mb-2">{AREA_LABELS[area]}</Small>
      <Title>Your rating</Title>
      <Card className="mb-4">
        <View className="flex-row items-end justify-between">
          <View className="flex-row items-end">
            <Text className="font-bold text-6xl text-ink">{result.score}</Text>
            <Small className="mb-3 ml-1">/ 100</Small>
          </View>
          <BandPill band={result.band} rough={result.rough} />
        </View>
        <ScoreBar area={area} score={result.score} />
        <Small className="mt-2">
          From {result.answered} of {preview.total} answers, as you described a normal week.
          {result.rough ? ' A few more answers would make it firmer.' : ''}
        </Small>
      </Card>
      <Text className="mb-2 font-semibold text-lg text-ink">
        {result.gaps.length > 0 ? 'Where the points went' : 'Looking good'}
      </Text>
      <GapList gaps={result.gaps} />
      <Body className="mt-4 text-muted">
        {result.gaps.length > 1
          ? 'Nobody fixes all of these at once. The next step is picking one, and that is what the coach for this area will help with.'
          : result.gaps.length === 1
            ? 'One clear thing to work on is a good place to be.'
            : 'If something still feels off here, the other areas may be where to look.'}
      </Body>
    </Screen>
  );
}
