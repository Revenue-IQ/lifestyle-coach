import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useSubmitComplaints } from '@/api/hooks';
import { useAppAuth } from '@/auth';
import { AreaCard } from '@/components/AreaCard';
import { Button, ErrorText, Loading, SafetyNotice, Screen, Small, Subtitle, Title } from '@/components/ui';
import { CRISIS_CARD, looksLikeCrisis } from '@wellbeing/shared';
import { clearPending, loadPending, type PendingComplaints } from '@/lib/pending';

/** The instant result, and the one place that asks the person to make an account. */
export default function WhereToLook() {
  const { isSignedIn } = useAppAuth();
  const [pending, setPending] = useState<PendingComplaints | null | undefined>(undefined);
  const submit = useSubmitComplaints();

  useEffect(() => {
    loadPending().then((p) => setPending(p));
  }, []);

  if (pending === undefined) return <Loading />;
  if (pending === null) return <Redirect href="/" />;

  const save = async () => {
    if (!isSignedIn) {
      router.push('/sign-in');
      return;
    }
    await submit.mutateAsync(pending);
    await clearPending();
    router.replace('/home');
  };

  return (
    <Screen
      footer={
        <View>
          <Button
            title={isSignedIn ? 'Save this and keep going' : 'Save this and keep going'}
            onPress={save}
            loading={submit.isPending}
          />
          <Button title="Change my answers" variant="secondary" className="mt-2" onPress={() => router.back()} />
          <ErrorText error={submit.error} />
        </View>
      }
    >
      {looksLikeCrisis(pending.freeText) ? <SafetyNotice text={CRISIS_CARD} /> : null}

      <Title>Here's a first look</Title>
      <Subtitle>
        Based on what you picked, these are the areas most often behind it. Nothing here is a verdict. It's a starting point.
      </Subtitle>

      <AreaCard complaintIds={pending.complaintIds} />

      {pending.freeText ? (
        <View className="mt-4">
          <Small>You wrote: "{pending.freeText}". We keep it as written.</Small>
        </View>
      ) : null}

      {!isSignedIn ? (
        <View className="mt-6">
          <Small>
            Saving needs an account so your answers are still here next time. Only an email for the sign-in code. We never ask for your real name.
            Your first points are waiting on the other side.
          </Small>
        </View>
      ) : null}
    </Screen>
  );
}
