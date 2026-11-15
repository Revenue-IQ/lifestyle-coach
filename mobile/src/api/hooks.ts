import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AreaAnswers, AreaId, Who5Answers } from '@wellbeing/shared';
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

export function useArea(area: AreaId) {
  const api = useApi();
  const { isSignedIn } = useAppAuth();
  return useQuery({
    queryKey: ['area', area],
    queryFn: () => unwrap(api.api.areas[':area'].$get({ param: { area } })),
    enabled: isSignedIn,
  });
}

export function useSubmitAreaCheckin(area: AreaId) {
  const api = useApi();
  const qc = useQueryClient();
  const after = useAfterContribution();
  return useMutation({
    mutationFn: (answers: AreaAnswers) =>
      unwrap(api.api.areas[':area'].checkins.$post({ param: { area }, json: { answers } })),
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: ['area', area] });
      await after(data.award);
    },
  });
}

const stepsKey = ['steps'] as const;

export function useOpenCoach(area: AreaId) {
  const api = useApi();
  return useMutation({
    mutationFn: (startOver: boolean) => unwrap(api.api.areas[':area'].coach.$post({ param: { area }, json: { startOver } })),
  });
}

export function useSendCoachMessage(conversationId: string | null) {
  const api = useApi();
  return useMutation({
    mutationFn: (content: string) => {
      if (!conversationId) throw new Error('No conversation open');
      return unwrap(api.api.coach[':id'].messages.$post({ param: { id: conversationId }, json: { content } }));
    },
  });
}

export function useAcceptStep(conversationId: string | null) {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => {
      if (!conversationId) throw new Error('No conversation open');
      return unwrap(api.api.coach[':id'].steps.$post({ param: { id: conversationId }, json: { messageId } }));
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: meKey });
      await qc.invalidateQueries({ queryKey: stepsKey });
    },
  });
}

export function useSteps() {
  const api = useApi();
  const { isSignedIn } = useAppAuth();
  return useQuery({ queryKey: stepsKey, queryFn: () => unwrap(api.api.steps.$get()), enabled: isSignedIn });
}

export function useLogStep() {
  const api = useApi();
  const qc = useQueryClient();
  const after = useAfterContribution();
  return useMutation({
    mutationFn: (stepId: string) => unwrap(api.api.steps[':id'].log.$post({ param: { id: stepId }, json: {} })),
    onSuccess: async (data) => {
      await qc.invalidateQueries({ queryKey: stepsKey });
      await after(data.award);
    },
  });
}

function useStepAction(path: 'reflect' | 'continue' | 'close') {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ stepId, helped }: { stepId: string; helped?: 'yes' | 'a-bit' | 'no' }) => {
      const param = { id: stepId };
      if (path === 'reflect') return unwrap(api.api.steps[':id'].reflect.$post({ param, json: { helped: helped ?? 'a-bit' } }));
      if (path === 'continue') return unwrap(api.api.steps[':id'].continue.$post({ param }));
      return unwrap(api.api.steps[':id'].close.$post({ param }));
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: stepsKey });
      await qc.invalidateQueries({ queryKey: meKey });
    },
  });
}

export const useReflectStep = () => useStepAction('reflect');
export const useContinueStep = () => useStepAction('continue');
export const useCloseStep = () => useStepAction('close');

export function useDropStep() {
  const api = useApi();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (stepId: string) => unwrap(api.api.steps[':id'].drop.$post({ param: { id: stepId } })),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: stepsKey });
      await qc.invalidateQueries({ queryKey: meKey });
    },
  });
}

export type ProfilePatch = {
  name?: string;
  over18?: boolean | null;
  age?: number | null;
  sex?: string | null;
  weightKg?: number | null;
  activityLevel?: string | null;
  pregnantOrBreastfeeding?: boolean | null;
  conditions?: string | null;
};

export function useUpdateProfile() {
  const api = useApi();
  const after = useAfterContribution();
  return useMutation({
    mutationFn: (json: ProfilePatch) => unwrap(api.api.profile.$patch({ json })),
    onSuccess: (data) => after(data.award),
  });
}
