import { env } from '../config/env';

/**
 * The one place that talks to the Gemini API, over plain HTTP.
 * Text generation asks for JSON against a schema and walks a chain of models:
 * the configured one first, then fallbacks when it times out or reports high
 * demand. A model that just failed is skipped for a few minutes so a busy
 * model never makes every reply wait. Swapping provider or tier means changing
 * this file only.
 */
const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const COOLDOWN_MS = 5 * 60_000;

export class AiUnavailableError extends Error {
  constructor(message = 'The coach needs a GEMINI_API_KEY in the API environment.') {
    super(message);
  }
}

/** Thrown when every model in the chain failed for a reason that is theirs, not ours. */
export class AiBusyError extends Error {
  constructor(message = 'The coach is busy right now. Give it a minute and try again; nothing you said is lost.') {
    super(message);
  }
}

/** Every model has used up its free daily allowance. Carries when the earliest one comes back. */
export class AiQuotaError extends AiBusyError {
  constructor(public retryAfterMs: number) {
    const hours = Math.max(1, Math.round(retryAfterMs / 3_600_000));
    super(
      `The coach has used up today's free allowance from Google. It comes back in about ${hours} hour${hours === 1 ? '' : 's'}, or sooner once a paid plan is switched on. Nothing you said is lost.`,
    );
  }
}

export function aiEnabled(): boolean {
  return env.geminiApiKey.length > 0;
}

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface GenerateJsonOptions {
  system: string;
  turns: ChatTurn[];
  /** A JSON schema (OpenAPI subset) the reply must match. */
  schema: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
}

class GeminiHttpError extends Error {
  /** Set when Google says the model's daily free quota is spent, from its own retry delay. */
  public dailyQuotaRetryMs: number | null = null;

  constructor(
    public status: number,
    public body: string,
  ) {
    super(`Gemini request failed (${status}): ${body.slice(0, 300)}`);
    if (status === 429 && /per day/i.test(body)) {
      const m = body.match(/"retryDelay":\s*"(\d+)s"/);
      this.dailyQuotaRetryMs = m ? Number(m[1]) * 1000 : 60 * 60_000;
    }
  }
}

/** A failure to reach Google at all (DNS, connect timeout, reset). Always worth trying the next model. */
class GeminiNetworkError extends Error {
  constructor(cause: unknown) {
    const inner = cause instanceof Error && cause.cause instanceof Error ? cause.cause.message : cause instanceof Error ? cause.message : String(cause);
    super(`Could not reach Gemini: ${inner.slice(0, 160)}`);
  }
}

async function call(path: string, body: unknown, timeoutMs: number): Promise<unknown> {
  if (!aiEnabled()) throw new AiUnavailableError();
  let res: Response;
  try {
    res = await fetch(`${BASE}/${path}?key=${encodeURIComponent(env.geminiApiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (err) {
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) throw err;
    throw new GeminiNetworkError(err);
  }
  if (!res.ok) throw new GeminiHttpError(res.status, await res.text().catch(() => ''));
  return res.json();
}

/** True for failures that are the model's (busy, overloaded, slow), where another model is worth trying. */
function isTransient(err: unknown): boolean {
  if (err instanceof GeminiNetworkError) return true;
  if (err instanceof GeminiHttpError) return err.status === 429 || err.status >= 500;
  if (err instanceof Error) {
    return err.name === 'TimeoutError' || err.name === 'AbortError' || /fetch failed|timeout/i.test(err.message);
  }
  return false;
}

const coolingDown = new Map<string, number>();

function textModelChain(): string[] {
  const now = Date.now();
  const chain = [env.geminiTextModel, ...env.geminiTextFallbackModels].filter((m, i, all) => all.indexOf(m) === i);
  const ready = chain.filter((m) => (coolingDown.get(m) ?? 0) < now);
  return ready.length > 0 ? ready : chain; // if everything is cooling down, try them all anyway
}

type GenerateResponse = {
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
};

async function generateWith(model: string, opts: GenerateJsonOptions, withThinkingConfig: boolean): Promise<string> {
  const generationConfig: Record<string, unknown> = {
    responseMimeType: 'application/json',
    responseSchema: opts.schema,
    temperature: opts.temperature ?? 0.6,
    maxOutputTokens: opts.maxOutputTokens ?? 1200,
  };
  // Keep the model from thinking at length: the coach's replies are short and the person is waiting.
  if (withThinkingConfig) generationConfig.thinkingConfig = { thinkingLevel: 'low' };

  const data = (await call(
    `models/${model}:generateContent`,
    {
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: opts.turns.map((t) => ({ role: t.role, parts: [{ text: t.text }] })),
      generationConfig,
    },
    env.geminiTimeoutMs,
  )) as GenerateResponse;

  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  const text = parts.filter((p) => !p.thought && typeof p.text === 'string').map((p) => p.text).join('');
  if (!text) throw new Error(`Gemini ${model} returned no text (finishReason ${candidate?.finishReason ?? 'unknown'})`);
  return text;
}

/** Generates a JSON object matching `schema`, trying the model chain in order. */
export async function generateJson<T>(opts: GenerateJsonOptions): Promise<T> {
  let lastError: unknown;
  let allDailyQuota = true;
  let earliestRetryMs = Infinity;
  for (const model of textModelChain()) {
    try {
      let text: string;
      try {
        text = await generateWith(model, opts, true);
      } catch (err) {
        // An older model may reject thinkingConfig; try once more without it.
        if (err instanceof GeminiHttpError && err.status === 400 && /thinking/i.test(err.body)) {
          text = await generateWith(model, opts, false);
        } else {
          throw err;
        }
      }
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new Error(`Gemini ${model} returned something that was not the JSON we asked for`);
      }
    } catch (err) {
      lastError = err;
      if (err instanceof AiUnavailableError) throw err;
      if (!isTransient(err)) throw err;
      const dailyMs = err instanceof GeminiHttpError ? err.dailyQuotaRetryMs : null;
      if (dailyMs !== null) {
        // Spent for the day: skip this model until Google says it is back, not just five minutes.
        coolingDown.set(model, Date.now() + dailyMs);
        earliestRetryMs = Math.min(earliestRetryMs, dailyMs);
      } else {
        allDailyQuota = false;
        coolingDown.set(model, Date.now() + COOLDOWN_MS);
      }
      console.warn(`[gemini] ${model} unavailable (${(err as Error).message.slice(0, 120)}), trying next model`);
    }
  }
  console.error('[gemini] every text model failed', lastError instanceof Error ? lastError.message.slice(0, 200) : lastError);
  if (allDailyQuota && Number.isFinite(earliestRetryMs)) throw new AiQuotaError(earliestRetryMs);
  throw new AiBusyError();
}

/**
 * Embeds one text. The embedding model has no task type setting, so queries and
 * documents are told apart with a text prefix, as the tech-stack doc records.
 */
export async function embed(text: string, kind: 'query' | 'document'): Promise<number[]> {
  const data = (await call(
    `models/${env.geminiEmbeddingModel}:embedContent`,
    {
      content: { parts: [{ text: `${kind}: ${text}` }] },
      outputDimensionality: env.embeddingDimensions,
    },
    env.geminiTimeoutMs,
  )) as { embedding?: { values?: number[] } };
  const values = data.embedding?.values;
  if (!values || values.length !== env.embeddingDimensions) {
    throw new Error(`Embedding came back with ${values?.length ?? 0} dimensions, expected ${env.embeddingDimensions}`);
  }
  return values;
}
