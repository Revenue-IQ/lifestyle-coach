/**
 * Pulls the JSON object out of a model reply. Models asked for JSON mostly return
 * exactly that, but a lite model now and then wraps it in a code fence, adds a
 * word before it, or is cut off by the output limit. The first two are repaired
 * here; the third is reported with the finish reason so the caller can move on.
 */
export class NotJsonError extends Error {
  constructor(model: string, finishReason: string | undefined, sample: string) {
    super(
      `Gemini ${model} returned something that was not the JSON we asked for (finishReason ${finishReason ?? 'unknown'}): ${sample.slice(0, 160).replace(/\s+/g, ' ')}`,
    );
  }
}

export function parseJsonLoosely<T>(text: string): T | undefined {
  const candidates = [text.trim()];
  const unfenced = text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
  if (unfenced !== candidates[0]) candidates.push(unfenced);
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first !== -1 && last > first) candidates.push(text.slice(first, last + 1));
  for (const c of candidates) {
    try {
      const value = JSON.parse(c);
      if (value && typeof value === 'object') return value as T;
    } catch {
      // try the next shape
    }
  }
  return undefined;
}
