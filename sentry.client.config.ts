/**
 * Sentry client-side init (instrumentation-client).
 * This file is imported from _app.tsx and only runs in the browser.
 * Set NEXT_PUBLIC_SENTRY_DSN in your env (e.g. Amplify) to enable.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

if (dsn) {
  const replayIntegration =
    typeof Sentry.replayIntegration === "function"
      ? Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        })
      : null;

  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_APPLICATION_ENV ?? process.env.NODE_ENV,

    integrations: replayIntegration ? [replayIntegration] : [],

    tracesSampleRate:
      process.env.NEXT_PUBLIC_APPLICATION_ENV === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate:
      process.env.NEXT_PUBLIC_APPLICATION_ENV === "production" ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,

    ignoreErrors: [
      "ResizeObserver loop",
      "Non-Error promise rejection",
    ],
  });
}
