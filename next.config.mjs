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
  org: process.env.SENTRY_ORG ?? "ramp-technology",
  project: process.env.SENTRY_PROJECT ?? "merchant-portal",
  // Avoid failing local builds/commits due to missing/invalid Sentry credentials.
  // Only attempt sourcemap upload in CI where credentials are expected.
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
