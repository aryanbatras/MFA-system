const LOCAL_ORIGINS = ["http://localhost:3000", "http://localhost:3001"];

/**
 * Resolve the canonical app URL.
 *
 * Vercel sets NEXT_PUBLIC_APP_URL to whatever was configured at build time. If
 * that value is a stale localhost URL, prefer the deployment's own URL so auth
 * redirects and cookies keep working without a dashboard change. Production
 * deployments use the stable project domain; previews use their own hostname.
 */
export function getAppUrl(): string {
  const configured =
    process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL;

  if (process.env.VERCEL) {
    const vercelHost =
      process.env.VERCEL_ENV === "production"
        ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
        : process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;

    if (vercelHost) {
      return `https://${vercelHost}`;
    }
  }

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export function getTrustedOrigins(appUrl: string): string[] {
  const fromEnv = (process.env.TRUSTED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const vercelOrigins = [
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter((origin): origin is string => Boolean(origin));

  return Array.from(
    new Set([
      appUrl,
      ...LOCAL_ORIGINS,
      ...vercelOrigins,
      ...fromEnv,
      "https://mfa-auth-systems.vercel.app",
    ]),
  );
}
