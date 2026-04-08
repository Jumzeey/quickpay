# Sentry setup

Error and performance monitoring is wired through [Sentry](https://sentry.io) and the `@sentry/nextjs` SDK.

## 1. Create a Sentry project

1. Go to [sentry.io](https://sentry.io) and sign in or create an account.
2. Create a new project and choose **Next.js**.
3. Copy the **DSN** (Data Source Name) from the project settings.

## 2. Environment variables

Set these in your server environment (e.g. Amplify Console → Environment variables) and/or in local `.env`:

| Variable                 | Required        | Description                                                                             |
| ------------------------ | --------------- | --------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SENTRY_DSN` | Yes (to enable) | DSN from your Sentry project. Enables client- and server-side reporting.                |
| `SENTRY_DSN`             | Optional        | Server-only DSN; falls back to `NEXT_PUBLIC_SENTRY_DSN` if unset.                       |
| `SENTRY_ORG`             | For source maps | Your Sentry org slug (from Sentry URL). Needed for uploading source maps at build time. |
| `SENTRY_PROJECT`         | For source maps | Your Sentry project slug. Needed for uploading source maps at build time.               |

- If **only** `NEXT_PUBLIC_SENTRY_DSN` is set, errors and performance will be reported but stack traces may be minified.
- If **`SENTRY_ORG`** and **`SENTRY_PROJECT`** are also set, the build will upload source maps and you’ll get readable stack traces.

## 3. Local / dev

- For local dev, add `NEXT_PUBLIC_SENTRY_DSN` to `.env` (and optionally `SENTRY_ORG` / `SENTRY_PROJECT` if you want source map uploads on build).
- Sentry is no-op if `NEXT_PUBLIC_SENTRY_DSN` is not set; the app runs as before.

## 4. What’s included

- **Client** (`sentry.client.config.ts`): Errors, performance traces, and session replays (production only, sampled).
- **Server** (`sentry.server.config.ts`): API routes and server-side code.
- **Edge** (`sentry.edge.config.ts`): Middleware and edge runtime.

You can adjust sample rates and replay options in the `Sentry.init()` calls in those files.
