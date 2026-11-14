import { AREA_BLURBS, AREA_LABELS, isAreaId } from '@wellbeing/shared';
import { Link, Redirect, router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useArea, useMe } from '@/api/hooks';
import { useAppAuth } from '@/auth';
import { BandPill, GapList, ScoreBar } from '@/components/AreaRating';
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

  return <AreaBody area={area} points={me.data?.game.areaCheckinPoints ?? 25} />;
}

function AreaBody({ area, points }: { area: Parameters<typeof useArea>[0]; points: number }) {
  const q = useArea(area);
  if (q.isLoading || !q.data) return <Loading />;

  const [latest, ...older] = q.data.checkins;
  const colour = AREA_COLORS[area];

  return (
    <Screen
      footer={
        <View>
          <Link href={{ pathname: '/areas/[area]/rate', params: { area } }} asChild>
            <Button title={latest ? 'Rate it again' : `Rate it · +${points} points`} />
          </Link>
          <Button title="Back home" variant="secondary" className="mt-2" onPress={() => router.replace('/home')} />
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
        This rating comes from how you described a normal week, so it is only as sharp as the answers. Logging real days later will make it sharper, and a coach for this area is coming next.
      </Small>
    </Screen>
  );
}
