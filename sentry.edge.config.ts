/**
 * Sentry edge runtime init (middleware, edge API routes).
 * Set SENTRY_DSN or NEXT_PUBLIC_SENTRY_DSN in your env to enable.
 */
import * as Sentry from "@sentry/nextjs";

const dsn =
  process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;
const env =
  process.env.NEXT_PUBLIC_APPLICATION_ENV ?? process.env.NODE_ENV;

if (dsn) {
  Sentry.init({
    dsn,
    environment: env,
    tracesSampleRate: env === "production" ? 0.1 : 1.0,
  });
}
