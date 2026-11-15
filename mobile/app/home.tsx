import { Link, Redirect, router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { AreaStanding, Quest } from '@/api/client';
import { useMe, useSubmitComplaints } from '@/api/hooks';
import { useAppAuth } from '@/auth';
import { BandPill, capitalise, ScoreBar } from '@/components/AreaRating';
import { StepCard } from '@/components/StepCard';
import { Button, ErrorText, Loading, SafetyNotice, Screen, Small, Title } from '@/components/ui';
import { clearPending, loadPending } from '@/lib/pending';
import { AREA_COLORS } from '@/theme';

const QUEST_ROUTES: Record<Quest['id'], Href> = {
  complaints: { pathname: '/', params: { again: '1' } },
  name: '/name',
  baseline: '/baseline',
  'about-you': '/about-you',
};

/**
 * Home is the person's picture so far: one compact row of quick things to add
 * (today's mood, the two-week score, the one-time quests), then steps to do,
 * the areas worth a look, and the rest.
 */
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

  const { profile, standing, quests, latestBaseline, latestComplaints, game, areas, steps, safetyNotice, complaintFlags } = me.data;
  // Picked "feeling low" or "nothing feels fun" and no two-week score yet: that check-in comes first.
  const checkInFirst = complaintFlags.includes('mood') && !latestBaseline;
  const look = areas.filter((a) => a.section === 'look');
  const rest = areas.filter((a) => a.section === 'rest');
  const nothingYet = !latestComplaints && areas.every((a) => !a.latest);

  return (
    <Screen>
      {safetyNotice ? <SafetyNotice text={safetyNotice} /> : null}
      <View className="mb-5 flex-row items-start justify-between">
        <View className="flex-1">
          <Title>{profile.name ? `Hello, ${profile.name}` : 'Hello there'}</Title>
          <Small>
            Level {standing.level} · {standing.total} points
            {standing.next ? ` · ${standing.next.needed} to level ${standing.next.nextLevel}` : ''}
          </Small>
        </View>
        <Pressable accessibilityRole="button" onPress={() => signOut().then(() => router.replace('/'))} className="px-2 py-1">
          <Small>Sign out</Small>
        </Pressable>
      </View>

      <View className="mb-5 flex-row flex-wrap">
        <QuickPill href="/today" label="Right now" points={game.todayPoints} />
        {!checkInFirst ? (
          <QuickPill
            href="/baseline"
            label="Two weeks"
            points={latestBaseline ? undefined : (quests.find((q) => q.id === 'baseline')?.points ?? 30)}
            value={latestBaseline ? `${latestBaseline.score}/100` : undefined}
          />
        ) : null}
        {quests
          .filter((q) => q.id !== 'baseline' && q.id !== 'complaints')
          .map((q) => (
            <QuickPill key={q.id} href={QUEST_ROUTES[q.id]} label={QUEST_SHORT[q.id] ?? q.title} points={q.points} />
          ))}
      </View>

      {steps.length > 0 ? (
        <Section title="Your steps">
          {steps.map((s) => (
            <StepCard key={s.id} step={s} showArea points={game.stepLogPoints} />
          ))}
        </Section>
      ) : null}

      {checkInFirst ? <TwoWeekSection latestBaseline={latestBaseline} points={quests.find((q) => q.id === 'baseline')?.points ?? 30} reason /> : null}

      <Section
        title={nothingYet ? 'Your areas' : 'Worth a look'}
        aside={
          <Link href={{ pathname: '/', params: { again: '1' } }} asChild>
            <Pressable accessibilityRole="button">
              <Small className="text-accent">{latestComplaints ? "What's bugging you · change" : "What's bugging you"}</Small>
            </Pressable>
          </Link>
        }
      >
        {look.length > 0 ? (
          look.map((a, i) => <AreaRow key={a.area} area={a} first={i === 0} />)
        ) : nothingYet ? (
          rest.map((a) => <AreaRow key={a.area} area={a} />)
        ) : (
          <Small className="mb-2">Nothing is flagged right now. Rate an area below, or redo the two-week check-in to see where you stand.</Small>
        )}
      </Section>

      {!nothingYet && rest.length > 0 ? (
        <Section title="Everything else">
          {rest.map((a) => (
            <AreaRow key={a.area} area={a} quiet />
          ))}
        </Section>
      ) : null}

      <ErrorText error={submitComplaints.error} />
      {submitComplaints.error ? (
        <Button title="Try saving my answers again" variant="secondary" className="mt-2" onPress={() => { flushed.current = false; me.refetch(); }} />
      ) : null}
    </Screen>
  );
}

/** One or two words for a quest in the compact row; the full title lives on its page. */
const QUEST_SHORT: Record<string, string> = { name: 'Name', 'about-you': 'About you' };

/** A small pill in the row under the greeting: a word or two, and what it gives. */
function QuickPill({ href, label, points, value }: { href: Href; label: string; points?: number; value?: string }) {
  return (
    <Link href={href} asChild>
      <Pressable accessibilityRole="button" className="mb-2 mr-2 flex-row items-center rounded-full border border-line bg-card px-3.5 py-2 active:bg-paper">
        <Text className="font-medium text-sm text-ink">{label}</Text>
        {value ? <Text className="ml-1.5 font-semibold text-sm text-ink">{value}</Text> : null}
        {points !== undefined ? <Text className="ml-1.5 font-semibold text-sm text-accent">+{points}</Text> : null}
      </Pressable>
    </Link>
  );
}

/** The WHO-5 card, shown only when it should come before anything else; the row has the pill otherwise. */
function TwoWeekSection({ latestBaseline, points, reason }: { latestBaseline: { score: number; createdAt: string } | null; points: number; reason?: boolean }) {
  return (
      <Section title="Two-week wellbeing">
        {reason ? (
          <Small className="mb-2">You said you've been feeling low. Five questions here tell you whether it's a blip or a pattern worth taking to a doctor. Worth doing before anything else.</Small>
        ) : null}
        <Link href="/baseline" asChild>
          <Pressable accessibilityRole="button" className="mb-2 flex-row items-center justify-between rounded-2xl border border-line bg-card px-4 py-3 active:bg-paper">
            {latestBaseline ? (
              <>
                <View className="flex-row items-end">
                  <Text className="font-bold text-2xl text-ink">{latestBaseline.score}</Text>
                  <Small className="mb-1 ml-1">/ 100 · {new Date(latestBaseline.createdAt).toLocaleDateString()}</Small>
                </View>
                <Small className="text-accent">Redo</Small>
              </>
            ) : (
              <>
                <View className="flex-1 pr-3">
                  <Text className="font-semibold text-base text-ink">Your starting line</Text>
                  <Small>Five questions, a score out of 100 to beat later.</Small>
                </View>
                <Text className="font-semibold text-base text-accent">+{points}</Text>
              </>
            )}
          </Pressable>
        </Link>
      </Section>
  );
}

function Section({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="mb-5">
      <View className="mb-2 flex-row items-center justify-between">
        <Text className="font-semibold text-lg text-ink">{title}</Text>
        {aside}
      </View>
      {children}
    </View>
  );
}

/** One area in the list. Quiet rows are for "everything else". */
function AreaRow({ area: a, first, quiet }: { area: AreaStanding; first?: boolean; quiet?: boolean }) {
  const colour = AREA_COLORS[a.area];
  const line = a.latest
    ? a.latest.gaps.length > 0
      ? capitalise(a.latest.gaps.slice(0, 2).join(', '))
      : null
    : a.signal
      ? `From: ${a.signal.from.join(', ').toLowerCase()}`
      : null;
  return (
    <Link href={{ pathname: '/areas/[area]', params: { area: a.area } }} asChild>
      <Pressable
        accessibilityRole="button"
        className={`mb-2 rounded-2xl border border-line bg-card active:bg-paper ${quiet ? 'px-4 py-3' : 'p-4'}`}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="mr-3 h-3 w-3 rounded-full" style={{ backgroundColor: colour.main }} />
            <Text className={`font-semibold text-base ${quiet ? 'text-muted' : 'text-ink'}`}>{a.label}</Text>
            {a.goodStart ? <Text className="ml-2 font-medium text-xs text-accent">Good place to start</Text> : null}
          </View>
          {a.latest ? (
            <View className="flex-row items-center">
              <Text className="mr-2 font-bold text-lg text-ink">{a.latest.score}</Text>
              <BandPill band={a.latest.band} rough={a.latest.rough} />
            </View>
          ) : (
            <Small>Not rated yet ›</Small>
          )}
        </View>
        {!quiet && a.latest ? <ScoreBar area={a.area} score={a.latest.score} /> : null}
        {!quiet && line ? <Small className="mt-2">{line}</Small> : null}
      </Pressable>
    </Link>
  );
}
