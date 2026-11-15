function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing environment variable ${name}`);
  return v;
}

export const env = {
  databaseUrl: required('DATABASE_URL'),
  /** "dev" accepts an x-dev-user-id header. Anything else requires a Clerk token. */
  authMode: process.env.AUTH_MODE === 'dev' ? ('dev' as const) : ('clerk' as const),
  clerkSecretKey: process.env.CLERK_SECRET_KEY ?? '',
  clerkPublishableKey: process.env.CLERK_PUBLISHABLE_KEY ?? '',
  port: Number(process.env.PORT ?? 8787),

  /** Gemini, called only from here. Empty key: the coach answers 503 and retrieval falls back to tags. */
  geminiApiKey: process.env.GEMINI_API_KEY ?? '',
  /**
   * Model names live here and nowhere else (docs/architecture/tech-stack.md).
   * Lite models first: on the free tier they allow far more requests a day than
   * the full flash models, and the coach's replies are short and simple.
   */
  geminiTextModel: process.env.GEMINI_TEXT_MODEL ?? 'gemini-3.5-flash-lite',
  /** Tried in order when the text model times out, reports high demand, or is out of daily quota. */
  geminiTextFallbackModels: (process.env.GEMINI_TEXT_FALLBACK_MODELS ?? 'gemini-3.1-flash-lite,gemini-3.5-flash,gemini-3.8-flash')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  /** How long one generation request may take before the next model is tried. */
  geminiTimeoutMs: Number(process.env.GEMINI_TIMEOUT_MS ?? 15_000),
  geminiEmbeddingModel: process.env.GEMINI_EMBEDDING_MODEL ?? 'gemini-embedding-2',
  embeddingDimensions: 768,
};

if (env.authMode === 'clerk' && !env.clerkSecretKey) {
  throw new Error('CLERK_SECRET_KEY is required unless AUTH_MODE=dev');
}
