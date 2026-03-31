// next.config.mjs
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'avatars.dicebear.com',
      'rampadmindevbucket.s3.amazonaws.com',
      'rampadmindevbucket.s3.us-east-1.amazonaws.com',
      'rampadminproductionbucket.s3.amazonaws.com',
      'rampadminproductionbucket.s3.us-east-1.amazonaws.com',
    ],
  },
  optimizeFonts: true,
};

const sentryWebpackPluginOptions = {
  // Disable Sentry build-time hooks locally so commits/builds don't fail.
  // In CI we keep Sentry enabled (release + sourcemaps upload).
  disableSentryConfig: !process.env.CI,
  org: process.env.SENTRY_ORG ?? "ramp-technology",
  project: process.env.SENTRY_PROJECT ?? "merchant-portal",
  // Only use an auth token in CI (local dev machines may have stale/invalid tokens).
  // If a token exists locally, Sentry CLI can still pick it up from env, so we also disable Sentry config above.
  authToken: process.env.CI ? process.env.SENTRY_AUTH_TOKEN : undefined,
  sourcemaps: {
    disable: !process.env.CI,
  },
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
  // Edge runtime (middleware) doesn't support OpenTelemetry/performance — disable to avoid "performance is not defined"
  webpack: {
    autoInstrumentMiddleware: false,
  },
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
