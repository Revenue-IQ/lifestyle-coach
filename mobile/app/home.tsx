import { AREA_LABELS, litAreas } from '@wellbeing/shared';
import { Link, Redirect, router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useMe, useSubmitComplaints } from '@/api/hooks';
import type { Quest } from '@/api/client';
import { useAppAuth } from '@/auth';
import { BandPill, capitalise, ScoreBar } from '@/components/AreaRating';
import { Body, Button, Card, ErrorText, Loading, Screen, Small, Title } from '@/components/ui';
import { clearPending, loadPending } from '@/lib/pending';
import { AREA_COLORS } from '@/theme';

const QUEST_ROUTES: Record<Quest['id'], Href> = {
  complaints: { pathname: '/', params: { again: '1' } },
  name: '/name',
  baseline: '/baseline',
  'about-you': '/about-you',
};

export default function Home() {
  const { isLoaded, isSignedIn, signOut } = useAppAuth();
  const me = useMe();
  const submitComplaints = useSubmitComplaints();
  const flushed = useRef(false);

  // Answers given before the account existed are sent once, right after sign-in.
  useEffect(() => {
    if (!isSignedIn || flushed.current) return;
    flushed.current = true;
    loadPending().then(async (pending) => {
      if (!pending) return;
      try {
        await submitComplaints.mutateAsync(pending);
        await clearPending();
      } catch {
        flushed.current = false;
      }
    });
  }, [isSignedIn, submitComplaints]);

  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <Redirect href="/" />;
  if (me.isLoading || !me.data) return <Loading />;

  const { profile, standing, quests, latestBaseline, latestComplaints, game, areas } = me.data;
  const lit = latestComplaints ? litAreas(latestComplaints.complaintIds) : [];

  return (
    <Screen>
      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-1">
          <Title>{profile.name ? `Hello, ${profile.name}` : 'Hello there'}</Title>
          <Small>Good to see you. Add whatever you feel like adding.</Small>
        </View>
        <Pressable accessibilityRole="button" onPress={() => signOut().then(() => router.replace('/'))} className="px-2 py-1">
          <Small>Sign out</Small>
        </Pressable>
      </View>

      <Card className="mb-4">
        <View className="flex-row items-end justify-between">
          <View>
            <Small>Level {standing.level}</Small>
            <Text className="font-bold text-4xl text-ink">{standing.total}</Text>
            <Small>points</Small>
          </View>
          {standing.next ? (
            <View className="items-end">
              <Small className="text-right">
                {standing.next.needed} more to level {standing.next.nextLevel}
              </Small>
            </View>
          ) : (
            <Small>Top level. Respect.</Small>
          )}
        </View>
        {standing.next ? <ProgressBar total={standing.total} needed={standing.next.needed} /> : null}
      </Card>

      <Text className="mb-1 font-semibold text-lg text-ink">Your areas</Text>
      <Small className="mb-3">
        {areas.some((a) => a.latest)
          ? 'Weakest first, so the top one is where to start. Rated from how you described a normal week.'
          : 'Five things you do that shape how you feel. Rate one and it moves to the top if it needs attention.'}
      </Small>
      <View className="mb-6">
        {areas.map((a, i) => (
          <Link key={a.area} href={{ pathname: '/areas/[area]', params: { area: a.area } }} asChild>
            <Pressable accessibilityRole="button" className="mb-2 rounded-2xl border border-line bg-card p-4 active:bg-paper">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="mr-3 h-3 w-3 rounded-full" style={{ backgroundColor: AREA_COLORS[a.area].main }} />
                  <Text className="font-semibold text-base text-ink">{a.label}</Text>
                  {i === 0 && a.latest && a.latest.band === 'attention' ? (
                    <Text className="ml-2 font-medium text-xs text-warn">start here</Text>
                  ) : null}
                </View>
                {a.latest ? (
                  <View className="flex-row items-center">
                    <Text className="mr-2 font-bold text-lg text-ink">{a.latest.score}</Text>
                    <BandPill band={a.latest.band} rough={a.latest.rough} />
                  </View>
                ) : (
                  <Text className="font-semibold text-base text-accent">Rate it · +{game.areaCheckinPoints}</Text>
                )}
              </View>
              {a.latest ? <ScoreBar area={a.area} score={a.latest.score} /> : null}
              {a.latest && a.latest.gaps.length > 0 ? (
                <Small className="mt-2">{capitalise(a.latest.gaps.slice(0, 2).join(', '))}</Small>
              ) : null}
            </Pressable>
          </Link>
        ))}
      </View>

      <Text className="mb-2 font-semibold text-lg text-ink">Quick add</Text>
      <Link href="/today" asChild>
        <Pressable accessibilityRole="button" className="mb-6 rounded-2xl border border-line bg-card p-4 active:bg-paper">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="font-semibold text-base text-ink">How are you right now?</Text>
              <Small>Mood and energy, two taps. +{game.todayPoints} points, up to {game.todayCapPerDay} times a day.</Small>
            </View>
            <Text className="font-bold text-xl text-accent">+</Text>
          </View>
        </Pressable>
      </Link>

      {quests.length > 0 ? (
        <View className="mb-6">
          <Text className="mb-2 font-semibold text-lg text-ink">Small quests</Text>
          <Small className="mb-3">Optional, every one of them. Each adds something to your picture.</Small>
          {quests.map((q) => (
            <Link key={q.id} href={QUEST_ROUTES[q.id]} asChild>
              <Pressable accessibilityRole="button" className="mb-2 rounded-2xl border border-line bg-card p-4 active:bg-paper">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="font-semibold text-base text-ink">{q.title}</Text>
                    <Small>{q.payoff}</Small>
                  </View>
                  <Text className="font-semibold text-base text-accent">+{q.points}</Text>
                </View>
              </Pressable>
            </Link>
          ))}
        </View>
      ) : null}

      <Text className="mb-2 font-semibold text-lg text-ink">Your picture so far</Text>

      <Card className="mb-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-base text-ink">Where to look first</Text>
          <Link href={{ pathname: '/', params: { again: '1' } }} asChild>
            <Pressable accessibilityRole="button"><Small className="text-accent">Answer again</Small></Pressable>
          </Link>
        </View>
        {lit.length > 0 ? (
          <View className="mt-3 flex-row flex-wrap">
            {lit.map((r) => (
              <View key={r.area} className="mb-2 mr-2 rounded-full px-3 py-1.5" style={{ backgroundColor: AREA_COLORS[r.area].soft }}>
                <Text className="font-medium text-sm" style={{ color: AREA_COLORS[r.area].main }}>{AREA_LABELS[r.area]}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Small className="mt-2">
            {latestComplaints ? 'You picked "not sure". The two-week check-in is the best next step.' : 'Nothing yet. Tell us what is bugging you and this fills in.'}
          </Small>
        )}
      </Card>

      <Card className="mb-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-base text-ink">Two-week wellbeing</Text>
          <Link href="/baseline" asChild>
            <Pressable accessibilityRole="button"><Small className="text-accent">{latestBaseline ? 'Redo' : 'Start'}</Small></Pressable>
          </Link>
        </View>
        {latestBaseline ? (
          <View className="mt-2 flex-row items-end">
            <Text className="font-bold text-3xl text-ink">{latestBaseline.score}</Text>
            <Small className="mb-1 ml-1">/ 100 on {new Date(latestBaseline.createdAt).toLocaleDateString()}</Small>
          </View>
        ) : (
          <Small className="mt-2">Your starting line. Later we show how it moves.</Small>
        )}
      </Card>

      <Card className="mb-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-base text-ink">About you</Text>
          <Link href="/about-you" asChild>
            <Pressable accessibilityRole="button"><Small className="text-accent">Edit</Small></Pressable>
          </Link>
        </View>
        <Body className="mt-2 text-muted">
          {[
            profile.age ? `${profile.age} years` : null,
            profile.sex ?? null,
            profile.weightKg ? `${profile.weightKg} kg` : null,
            profile.activityLevel ? profile.activityLevel.replaceAll('-', ' ') : null,
          ]
            .filter(Boolean)
            .join(' · ') || 'Nothing added yet. Everything here is optional and editable.'}
        </Body>
      </Card>

      <ErrorText error={submitComplaints.error} />
      {submitComplaints.error ? (
        <Button title="Try saving my answers again" variant="secondary" className="mt-2" onPress={() => { flushed.current = false; me.refetch(); }} />
      ) : null}
    </Screen>
  );
}

function ProgressBar({ total, needed }: { total: number; needed: number }) {
  const span = total + needed;
  const pct = span > 0 ? Math.min(100, Math.round((total / span) * 100)) : 0;
  return (
    <View className="mt-3 h-2 w-full overflow-hidden rounded-full bg-paper">
      <View className="h-2 rounded-full bg-accent" style={{ width: `${pct}%` }} />
    </View>
  );
}
