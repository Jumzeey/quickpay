/**
 * Sentry client-side init. Loaded before the app so errors and performance are captured.
 * Set NEXT_PUBLIC_SENTRY_DSN in your env (e.g. Amplify) to enable.
 */
import * as Sentry from "@sentry/nextjs";
import { replayIntegration } from "@sentry/replay";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const env = process.env.NEXT_PUBLIC_APPLICATION_ENV ?? process.env.NODE_ENV;

if (dsn) {
  const isBrowser = typeof window !== "undefined";
  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate: env === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: env === "production" ? 0.1 : 0,
    replaysOnErrorSampleRate: env === "production" ? 1.0 : 0,
    integrations: isBrowser
      ? [
          replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ]
      : [],
    ignoreErrors: [
      "ResizeObserver loop",
      "Non-Error promise rejection",
    ],
  });
}
