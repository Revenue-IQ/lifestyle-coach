import { Redirect, router } from 'expo-router';
import { goBack } from '@/lib/navigation';
import { useState } from 'react';
import { Platform, TextInput, View } from 'react-native';
import { AUTH_MODE, useAppAuth } from '@/auth';
import { Button, Card, Screen, Small, Subtitle, Title } from '@/components/ui';

/**
 * Login. With Clerk keys, Clerk's own email-code sign-in. Without them, a dev
 * sign-in that works against an API running with AUTH_MODE=dev.
 */
export default function SignIn() {
  const { isLoaded, isSignedIn } = useAppAuth();
  if (isLoaded && isSignedIn) return <Redirect href="/home" />;

  return (
    <Screen>
      <Small className="mb-1 font-semibold text-accent">Inner Weather</Small>
      <Title>Save your answers</Title>
      <Subtitle>
        An email is all we need, to send you a sign-in code. No password to remember, and no real name anywhere.
      </Subtitle>
      {AUTH_MODE === 'clerk' ? <ClerkSignIn /> : <DevSignIn />}
      <Button title="Not now" variant="ghost" className="mt-4" onPress={() => goBack('/')} />
    </Screen>
  );
}

function ClerkSignIn() {
  if (Platform.OS !== 'web') {
    return (
      <Card>
        <Small>Native sign-in arrives with the mobile phase. For now, use the web app.</Small>
      </Card>
    );
  }
  // Loaded lazily so the native bundle never pulls in the web components.
  const { SignIn: ClerkSignInComponent } = require('@clerk/expo/web') as typeof import('@clerk/expo/web');
  return (
    <View className="items-center">
      <ClerkSignInComponent routing="hash" fallbackRedirectUrl="/home" signUpFallbackRedirectUrl="/home" />
    </View>
  );
}

function DevSignIn() {
  const { devSignIn } = useAppAuth();
  const [email, setEmail] = useState('');
  const ok = email.trim().length > 0;
  return (
    <Card>
      <Small className="mb-3">
        Developer sign-in: Clerk keys are not set, so any email works and nothing is sent. The API must run with AUTH_MODE=dev.
      </Small>
      <TextInput
        className="min-h-[52px] rounded-2xl border border-line bg-paper px-4 py-3 font-sans text-base text-ink"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="none"
        keyboardType="email-address"
        inputMode="email"
        autoFocus
        onSubmitEditing={() => ok && devSignIn?.(email).then(() => router.replace('/home'))}
      />
      <Button
        title="Continue"
        className="mt-3"
        disabled={!ok}
        onPress={() => devSignIn?.(email).then(() => router.replace('/home'))}
      />
    </Card>
  );
}
