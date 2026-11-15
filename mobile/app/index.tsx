import { cardsForRound, COMPLAINTS, FREE_TEXT_FIELD, NOT_SURE_ID, ROUNDS } from '@wellbeing/shared';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useAppAuth } from '@/auth';
import { Ask } from '@/components/Ask';
import { Brand, Hero } from '@/components/Brand';
import { Button, Chip, Loading, Screen, Small, Subtitle, Title } from '@/components/ui';
import { useMe } from '@/api/hooks';
import { savePending } from '@/lib/pending';

/**
 * The first screens, before any login. Two rounds of cards: how the person has
 * been feeling, then what their days are like. See docs/features/whats-bugging-you.md.
 */
export default function FirstScreen() {
  const { again } = useLocalSearchParams<{ again?: string }>();
  const { isLoaded, isSignedIn } = useAppAuth();
  const me = useMe();
  const [round, setRound] = useState<1 | 2>(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [freeText, setFreeText] = useState('');

  // A returning person who has already answered goes straight home, unless they chose to answer again.
  if (!isLoaded) return <Loading />;
  if (isSignedIn && !again) {
    if (me.isLoading) return <Loading />;
    if (me.data?.latestComplaints) return <Redirect href="/home" />;
  }

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      // "Not sure" stands alone in round one: picking it clears the rest, and picking anything else clears it.
      if (id === NOT_SURE_ID) return [id];
      return [...prev.filter((x) => x !== NOT_SURE_ID), id];
    });
  };

  const notSure = selected.includes(NOT_SURE_ID);
  const current = ROUNDS[round - 1];
  const cards = cardsForRound(round);
  const pickedThisRound = cards.filter((c) => selected.includes(c.id)).length;
  const notSureCard = COMPLAINTS.find((c) => c.id === NOT_SURE_ID)!;

  const finish = async () => {
    // Nothing picked and nothing written is an answer too: it is "not sure".
    const ids = selected.length === 0 && !freeText.trim() ? [NOT_SURE_ID] : selected;
    await savePending({ complaintIds: ids, freeText: freeText.trim() || undefined });
    router.push('/where-to-look');
  };

  const nextLabel = round === 1 ? (pickedThisRound === 0 && !notSure ? 'None of these, next' : 'Next') : 'Show me where to look';

  return (
    <Screen
      footer={
        <View>
          <Button title={nextLabel} onPress={() => (round === 1 ? setRound(2) : finish())} />
          {round === 2 ? <Button title="Back" variant="secondary" className="mt-2" onPress={() => setRound(1)} /> : null}
        </View>
      }
    >
      {round === 1 ? <Hero className="mb-7" /> : <Brand className="mb-5" />}
      <Small className="mb-2">{round} of 2</Small>
      <Title>{current.title}</Title>
      <Subtitle>{current.subtitle}</Subtitle>

      <View className="mb-4 flex-row flex-wrap">
        {cards.map((c) => (
          <Chip key={c.id} label={c.label} selected={selected.includes(c.id)} onPress={() => toggle(c.id)} />
        ))}
      </View>

      {round === 1 ? (
        <View className="mb-6">
          <Chip label={notSureCard.label} selected={notSure} onPress={() => toggle(NOT_SURE_ID)} wide />
        </View>
      ) : (
        <View className="mt-2">
          <Ask field={FREE_TEXT_FIELD} value={freeText} onChange={setFreeText} />
          <Small>Skip anything that doesn't fit. Fewer, truer taps beat a full card.</Small>
        </View>
      )}
    </Screen>
  );
}
