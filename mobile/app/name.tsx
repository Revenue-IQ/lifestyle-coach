import { PROFILE_FIELDS, randomName } from '@wellbeing/shared';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useMe, useUpdateProfile } from '@/api/hooks';
import { useAppAuth } from '@/auth';
import { Ask } from '@/components/Ask';
import { Button, ErrorText, Loading, Screen, Subtitle, Title } from '@/components/ui';

/** The Name quest. One tap on "Pick one for me" is enough. */
export default function Name() {
  const { isLoaded, isSignedIn } = useAppAuth();
  const me = useMe();
  const update = useUpdateProfile();
  const [name, setName] = useState<string | null>(null);

  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <Redirect href="/" />;
  if (me.isLoading) return <Loading />;

  const value = name ?? me.data?.profile.name ?? '';
  const ok = value.trim().length > 0;

  const save = async () => {
    await update.mutateAsync({ name: value.trim() });
    router.replace('/home');
  };

  return (
    <Screen
      footer={
        <View>
          <Button title="Save" onPress={save} disabled={!ok} loading={update.isPending} />
          <Button title="Not now" variant="secondary" className="mt-2" onPress={() => router.back()} />
          <ErrorText error={update.error} />
        </View>
      }
    >
      <Title>Pick a name</Title>
      <Subtitle>So we have something to call you. Change it whenever you like.</Subtitle>
      <Ask field={PROFILE_FIELDS.name} value={value} onChange={setName} autoFocus />
      <Button title="Pick one for me" variant="secondary" onPress={() => setName(randomName())} />
    </Screen>
  );
}
