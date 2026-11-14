import { COMPLAINTS, FREE_TEXT_FIELD, NOT_SURE_ID } from '@wellbeing/shared';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useAppAuth } from '@/auth';
import { Ask } from '@/components/Ask';
import { Button, Chip, Loading, Screen, Small, Subtitle, Title } from '@/components/ui';
import { useMe } from '@/api/hooks';
import { savePending } from '@/lib/pending';

/**
 * The first screen, before any login: "What's bugging you?"
 * See docs/features/whats-bugging-you.md.
 */
export default function WhatsBuggingYou() {
  const { again } = useLocalSearchParams<{ again?: string }>();
  const { isLoaded, isSignedIn } = useAppAuth();
  const me = useMe();
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
      // "Not sure" stands alone: picking it clears the rest, and picking anything else clears it.
      if (id === NOT_SURE_ID) return [id];
      return [...prev.filter((x) => x !== NOT_SURE_ID), id];
    });
  };

  const canContinue = selected.length > 0 || freeText.trim().length > 0;

  const next = async () => {
    await savePending({ complaintIds: selected, freeText: freeText.trim() || undefined });
    router.push('/where-to-look');
  };

  return (
    <Screen
      footer={
        <Button title="Show me where to look" onPress={next} disabled={!canContinue} />
      }
    >
      <Title>What's bugging you?</Title>
      <Subtitle>
        Pick anything that sounds like you. We use it to work out where to look first. No account needed for this bit.
      </Subtitle>

      <View className="mb-6 flex-row flex-wrap">
        {COMPLAINTS.map((c) => (
          <Chip key={c.id} label={c.label} selected={selected.includes(c.id)} onPress={() => toggle(c.id)} />
        ))}
      </View>

      <Ask field={FREE_TEXT_FIELD} value={freeText} onChange={setFreeText} />

      {!canContinue ? <Small>Pick at least one, or write a line. Either is fine.</Small> : null}
    </Screen>
  );
}
