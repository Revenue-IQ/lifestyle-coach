import { AREA_BLURBS, AREA_LABELS, isAreaId } from '@wellbeing/shared';
import { Link, Redirect, router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useArea, useMe, useSteps } from '@/api/hooks';
import { useAppAuth } from '@/auth';
import { BandPill, GapList, ScoreBar } from '@/components/AreaRating';
import { StepCard } from '@/components/StepCard';
import { Body, Button, Card, Loading, Screen, Small, Subtitle, Title } from '@/components/ui';
import { AREA_COLORS } from '@/theme';

/** One life area: its latest rating, the gaps behind it, and its history. */
export default function AreaPage() {
  const { area } = useLocalSearchParams<{ area: string }>();
  const { isLoaded, isSignedIn } = useAppAuth();
  const me = useMe();

  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <Redirect href="/" />;
  if (!area || !isAreaId(area)) return <Redirect href="/home" />;

  return (
    <AreaBody
      area={area}
      points={me.data?.game.areaCheckinPoints ?? 25}
      stepPoints={me.data?.game.stepLogPoints ?? 10}
      coachEnabled={me.data?.coachEnabled ?? false}
    />
  );
}

function AreaBody({
  area,
  points,
  stepPoints,
  coachEnabled,
}: {
  area: Parameters<typeof useArea>[0];
  points: number;
  stepPoints: number;
  coachEnabled: boolean;
}) {
  const q = useArea(area);
  const stepsQuery = useSteps();
  if (q.isLoading || !q.data) return <Loading />;

  const [latest, ...older] = q.data.checkins;
  const colour = AREA_COLORS[area];
  const areaSteps = (stepsQuery.data?.steps ?? []).filter((s) => s.area === area);
  // The step shown with its card: the active one, or a finished one whose follow-up question is still open.
  const activeStep = areaSteps.find((s) => s.status === 'active') ?? areaSteps.find((s) => s.status === 'done' && !s.followUp) ?? null;
  const finishedSteps = areaSteps.filter((s) => s.status === 'done' && s.id !== activeStep?.id);

  return (
    <Screen
      home
      footer={
        <View>
          {latest ? (
            <>
              <Link href={{ pathname: '/areas/[area]/coach', params: { area } }} asChild>
                <Button title={activeStep ? 'Talk to the coach' : 'Talk it through with the coach'} />
              </Link>
              <Link href={{ pathname: '/areas/[area]/rate', params: { area } }} asChild>
                <Button title="Rate it again" variant="secondary" className="mt-2" />
              </Link>
            </>
          ) : (
            <>
              <Link href={{ pathname: '/areas/[area]/rate', params: { area } }} asChild>
                <Button title={`Rate it · +${points} points`} />
              </Link>
              <Link href={{ pathname: '/areas/[area]/coach', params: { area } }} asChild>
                <Button title="Talk to the coach first" variant="secondary" className="mt-2" />
              </Link>
            </>
          )}
        </View>
      }
    >
      <View className="mb-1 flex-row items-center">
        <View className="mr-2 h-3 w-3 rounded-full" style={{ backgroundColor: colour.main }} />
        <Small>Life area</Small>
      </View>
      <Title>{AREA_LABELS[area]}</Title>
      <Subtitle>{AREA_BLURBS[area]}</Subtitle>

      {latest ? (
        <Card className="mb-4">
          <View className="flex-row items-end justify-between">
            <View className="flex-row items-end">
              <Text className="font-bold text-5xl text-ink">{latest.score}</Text>
              <Small className="mb-2 ml-1">/ 100</Small>
            </View>
            <BandPill band={latest.band} rough={latest.rough} />
          </View>
          <ScoreBar area={area} score={latest.score} />
          <Small className="mt-2">
            Rated {new Date(latest.createdAt).toLocaleDateString()} from {latest.answered} answers, as you described it.
            {latest.rough ? ' Answer a few more for a firmer number.' : ''}
          </Small>
          <Text className="mb-2 mt-4 font-semibold text-base text-ink">What's pulling it down</Text>
          <GapList gaps={latest.gaps} />
        </Card>
      ) : (
        <Card className="mb-4">
          <Text className="mb-1 font-semibold text-base text-ink">Not rated yet</Text>
          <Body className="text-muted">
            Five to seven quick questions about how things usually are. You get a number out of 100 and the two or three things most worth working on. Skip anything you like.
          </Body>
        </Card>
      )}

      {activeStep ? (
        <View className="mb-4">
          <Text className="mb-2 font-semibold text-base text-ink">Your step right now</Text>
          <StepCard step={activeStep} points={stepPoints} />
        </View>
      ) : latest ? (
        <Card className="mb-4">
          <Text className="mb-1 font-semibold text-base text-ink">No step yet</Text>
          <Small>
            {coachEnabled
              ? 'The coach reads the gaps above and helps you pick one small thing to try this week. Nobody fixes all of them at once.'
              : 'The coach is not switched on yet (the API needs a Gemini key). When it is, it reads the gaps above and helps you pick one small thing to try.'}
          </Small>
        </Card>
      ) : null}

      {finishedSteps.length > 0 ? (
        <View className="mb-4">
          <Text className="mb-2 font-semibold text-base text-ink">Steps you finished</Text>
          {finishedSteps.map((s) => (
            <View key={s.id} className="mb-1 flex-row items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
              <Small className="flex-1 pr-2">{s.title}</Small>
              <Small>
                {s.targetCount} times{s.helped === 'yes' ? ' · helped' : s.helped === 'a-bit' ? ' · helped a bit' : s.helped === 'no' ? ' · did not help' : ''}
              </Small>
            </View>
          ))}
        </View>
      ) : null}

      {older.length > 0 ? (
        <View className="mb-4">
          <Text className="mb-2 font-semibold text-base text-ink">Earlier ratings</Text>
          {older.map((c) => (
            <View key={c.id} className="mb-1 flex-row items-center justify-between rounded-2xl border border-line bg-card px-4 py-3">
              <Small>{new Date(c.createdAt).toLocaleDateString()}</Small>
              <View className="flex-row items-center">
                <Text className="mr-2 font-semibold text-base text-ink">{c.score}</Text>
                <BandPill band={c.band} />
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Small>
        This rating comes from how you described a normal week, so it is only as sharp as the answers. Logging real days later will make it sharper.
      </Small>
    </Screen>
  );
}
