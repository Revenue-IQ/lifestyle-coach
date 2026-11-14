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
};

if (env.authMode === 'clerk' && !env.clerkSecretKey) {
  throw new Error('CLERK_SECRET_KEY is required unless AUTH_MODE=dev');
}
