import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/**
 * One auth interface for the app, with two implementations:
 * Clerk when a publishable key is configured, otherwise a dev sign-in that
 * sends an x-dev-user-id header to an API running with AUTH_MODE=dev.
 */
export const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';
export const AUTH_MODE: 'clerk' | 'dev' = CLERK_PUBLISHABLE_KEY ? 'clerk' : 'dev';

export interface AppAuth {
  isLoaded: boolean;
  isSignedIn: boolean;
  authHeaders: () => Promise<Record<string, string>>;
  signOut: () => Promise<void>;
  /** Dev mode only. */
  devSignIn?: (id: string) => Promise<void>;
}

const AuthContext = createContext<AppAuth | null>(null);

export function useAppAuth(): AppAuth {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAppAuth must be used inside AuthProvider');
  return ctx;
}

function ClerkBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const value = useMemo<AppAuth>(
    () => ({
      isLoaded,
      isSignedIn: !!isSignedIn,
      authHeaders: async () => {
        const token = await getToken();
        const headers: Record<string, string> = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
      },
      signOut: async () => {
        await signOut();
      },
    }),
    [isLoaded, isSignedIn, getToken, signOut],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

const DEV_KEY = 'wellbeing.devUserId';

function DevAuthProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setLoaded] = useState(false);
  const [devId, setDevId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(DEV_KEY)
      .then((v) => setDevId(v))
      .finally(() => setLoaded(true));
  }, []);

  const devSignIn = useCallback(async (id: string) => {
    const clean = id.trim().toLowerCase();
    await AsyncStorage.setItem(DEV_KEY, clean);
    setDevId(clean);
  }, []);

  const value = useMemo<AppAuth>(
    () => ({
      isLoaded,
      isSignedIn: !!devId,
      authHeaders: async () => {
        const headers: Record<string, string> = {};
        if (devId) headers['x-dev-user-id'] = devId;
        return headers;
      },
      signOut: async () => {
        await AsyncStorage.removeItem(DEV_KEY);
        setDevId(null);
      },
      devSignIn,
    }),
    [isLoaded, devId, devSignIn],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (AUTH_MODE === 'clerk') {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        <ClerkBridge>{children}</ClerkBridge>
      </ClerkProvider>
    );
  }
  return <DevAuthProvider>{children}</DevAuthProvider>;
}
