import { TODAY_FIELDS } from '@wellbeing/shared';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSubmitToday } from '@/api/hooks';
import { useAppAuth } from '@/auth';
import { Ask } from '@/components/Ask';
import { Button, ErrorText, Loading, Screen, Subtitle, Title } from '@/components/ui';

/** The quick "today" entry: mood, energy, optional note. Repeatable. */
export default function Today() {
  const { isLoaded, isSignedIn } = useAppAuth();
  const submit = useSubmitToday();
  const [mood, setMood] = useState<number | null>(null);
  const [energy, setEnergy] = useState<number | null>(null);
  const [note, setNote] = useState('');

  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <Redirect href="/" />;

  const ok = mood !== null && energy !== null;

  const save = async () => {
    if (mood === null || energy === null) return;
    await submit.mutateAsync({ mood, energy, note: note.trim() || undefined });
    router.replace('/home');
  };

  return (
    <Screen
      footer={
        <View>
          <Button title="Save" onPress={save} disabled={!ok} loading={submit.isPending} />
          <Button title="Not now" variant="secondary" className="mt-2" onPress={() => router.back()} />
          <ErrorText error={submit.error} />
        </View>
      }
    >
      <Title>How are you right now?</Title>
      <Subtitle>Two taps and you're done. A note is welcome, never required.</Subtitle>
      <Ask field={TODAY_FIELDS.mood} value={mood} onChange={setMood} />
      <Ask field={TODAY_FIELDS.energy} value={energy} onChange={setEnergy} />
      <Ask field={TODAY_FIELDS.note} value={note} onChange={setNote} />
    </Screen>
  );
}
