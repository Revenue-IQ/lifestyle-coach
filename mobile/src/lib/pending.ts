import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Answers given before an account exists. They live on the device until the
 * person signs in, then they are sent to the API and cleared.
 */
export interface PendingComplaints {
  complaintIds: string[];
  freeText?: string;
}

const KEY = 'wellbeing.pendingComplaints';

export async function savePending(p: PendingComplaints): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
}

export async function loadPending(): Promise<PendingComplaints | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingComplaints;
  } catch {
    return null;
  }
}

export async function clearPending(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
