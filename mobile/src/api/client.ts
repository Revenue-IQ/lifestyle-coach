import { hc, type ClientResponse, type InferResponseType } from 'hono/client';
import { useMemo } from 'react';
import type { AppType } from '../../../api/src/app';
import { useAppAuth } from '../auth';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787';

export type ApiClient = ReturnType<typeof hc<AppType>>;

/** Hono's typed client, with the auth headers attached to every call. */
export function useApi(): ApiClient {
  const { authHeaders } = useAppAuth();
  return useMemo(() => hc<AppType>(API_URL, { headers: authHeaders }), [authHeaders]);
}

type Client = ApiClient;
export type Me = InferResponseType<Client['api']['me']['$get']>;
export type Award = NonNullable<InferResponseType<Client['api']['complaints']['$post'], 201>['award']>;
export type Quest = Me['quests'][number];
export type BaselineResult = InferResponseType<Client['api']['baseline']['$post'], 201>['checkin'];

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** The body type of a typed client response, success statuses only. */
type OkBody<R> = R extends ClientResponse<infer T, infer S, 'json'> ? (S extends 200 | 201 ? T : never) : never;

/** Awaits a typed client call and throws on non-2xx so React Query sees the failure. */
export async function unwrap<R extends ClientResponse<unknown, number, 'json'>>(pending: Promise<R>): Promise<OkBody<R>> {
  const res = await pending;
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body?.error === 'string') message = body.error;
    } catch {
      // keep the default message
    }
    throw new ApiError(res.status, message);
  }
  return (await res.json()) as OkBody<R>;
}
