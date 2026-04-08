/**
 * Next.js instrumentation entry — Sentry server and edge init.
 * Set SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN in your env to enable.
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  const dsn =
    process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
  const env =
    process.env.NEXT_PUBLIC_APPLICATION_ENV ?? process.env.NODE_ENV;

  if (!dsn) return;

  const initOptions = {
    dsn,
    environment: env,
    tracesSampleRate: env === "production" ? 0.1 : 1.0,
  };

  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init(initOptions);
  } else if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init(initOptions);
  }
}
