import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Who5Answers } from '@wellbeing/shared';
import { useAppAuth } from '../auth';
import { useAwards } from '../game/AwardContext';
import { unwrap, useApi, type Award } from './client';

export const meKey = ['me'] as const;

export function useMe() {
  const api = useApi();
  const { isSignedIn } = useAppAuth();
  return useQuery({
    queryKey: meKey,
    queryFn: () => unwrap(api.api.me.$get()),
    enabled: isSignedIn,
  });
}

/** Shared tail for every mutation: refresh "me" and show what was earned. */
function useAfterContribution() {
  const qc = useQueryClient();
  const { showAward } = useAwards();
  return async (award: Award | null | undefined) => {
    if (award) showAward(award);
    // A first-ever fetch of "me" that is still in flight would otherwise swallow the
    // invalidation and keep its pre-contribution numbers, so cancel it first.
    await qc.cancelQueries({ queryKey: meKey });
    await qc.invalidateQueries({ queryKey: meKey });
  };
}

export function useSubmitComplaints() {
  const api = useApi();
  const after = useAfterContribution();
  return useMutation({
    mutationFn: (json: { complaintIds: string[]; freeText?: string }) =>
      unwrap(api.api.complaints.$post({ json })),
    onSuccess: (data) => after(data.award),
  });
}

export function useSubmitBaseline() {
  const api = useApi();
  const after = useAfterContribution();
  return useMutation({
    mutationFn: (answers: Who5Answers) => unwrap(api.api.baseline.$post({ json: { answers } })),
    // When the score calls for the "talk to a professional" message, nothing celebratory
    // goes on top of it. The points are still earned; the result screen says so quietly.
    onSuccess: (data) => after(data.checkin.band === 'professional' ? null : data.award),
  });
}

export function useSubmitToday() {
  const api = useApi();
  const after = useAfterContribution();
  return useMutation({
    mutationFn: (json: { mood: number; energy: number; note?: string }) =>
      unwrap(api.api.today.$post({ json })),
    onSuccess: (data) => after(data.award),
  });
}

export type ProfilePatch = {
  name?: string;
  over18?: boolean | null;
  age?: number | null;
  sex?: string | null;
  weightKg?: number | null;
  activityLevel?: string | null;
};

export function useUpdateProfile() {
  const api = useApi();
  const after = useAfterContribution();
  return useMutation({
    mutationFn: (json: ProfilePatch) => unwrap(api.api.profile.$patch({ json })),
    onSuccess: (data) => after(data.award),
  });
}
