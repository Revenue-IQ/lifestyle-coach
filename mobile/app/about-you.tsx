import { ABOUT_YOU_FIELD_IDS, PROFILE_FIELDS, type ProfileFieldId } from '@wellbeing/shared';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useMe, useUpdateProfile, type ProfilePatch } from '@/api/hooks';
import { useAppAuth } from '@/auth';
import { Ask } from '@/components/Ask';
import { Button, ErrorText, Loading, Screen, Small, Subtitle, Title } from '@/components/ui';

type Values = Partial<Record<ProfileFieldId, unknown>>;

/**
 * The About you quest: one optional field at a time, each with its reason,
 * "Save" and "Skip" the same size. Everything stays editable.
 */
export default function AboutYou() {
  const { isLoaded, isSignedIn } = useAppAuth();
  const me = useMe();
  const update = useUpdateProfile();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<Values>({});

  if (!isLoaded) return <Loading />;
  if (!isSignedIn) return <Redirect href="/" />;
  if (me.isLoading || !me.data) return <Loading />;

  const fieldId = ABOUT_YOU_FIELD_IDS[step];
  const field = PROFILE_FIELDS[fieldId];
  const current = fieldId in values ? values[fieldId] : me.data.profile[fieldId as keyof typeof me.data.profile];
  const last = step === ABOUT_YOU_FIELD_IDS.length - 1;

  const advance = () => {
    if (last) router.replace('/home');
    else setStep(step + 1);
  };

  const save = async () => {
    const v = current;
    if (v === null || v === undefined || v === '') {
      advance();
      return;
    }
    const patch: ProfilePatch = { [fieldId]: v } as ProfilePatch;
    await update.mutateAsync(patch);
    advance();
  };

  const hasValue = current !== null && current !== undefined && current !== '';

  return (
    <Screen
      home
      footer={
        <View>
          <Button title={hasValue ? 'Save' : 'Save'} onPress={save} disabled={!hasValue} loading={update.isPending} />
          <Button title={last ? 'Skip and finish' : 'Skip'} variant="secondary" className="mt-2" onPress={advance} />
          <ErrorText error={update.error} />
        </View>
      }
    >
      <Small className="mb-2">
        {step + 1} of {ABOUT_YOU_FIELD_IDS.length} · all optional
      </Small>
      <Title>A bit about you</Title>
      <Subtitle>Each of these sharpens your ratings. Skip any you'd rather not answer, and come back whenever.</Subtitle>
      <Ask
        key={fieldId}
        field={field}
        value={current as never}
        onChange={(v) => setValues((prev) => ({ ...prev, [fieldId]: v }))}
        autoFocus={field.type === 'number'}
      />
      {'ifSkipped' in field && field.ifSkipped ? <Small>If you skip: {field.ifSkipped}</Small> : null}
    </Screen>
  );
}
