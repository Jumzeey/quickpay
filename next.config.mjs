// next.config.mjs
import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'avatars.dicebear.com',
      'rampadmindevbucket.s3.amazonaws.com',
      'rampadminproductionbucket.s3.amazonaws.com',
    ],
  },
  optimizeFonts: true,
};

const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG ?? "ramp-technology",
  project: process.env.SENTRY_PROJECT ?? "merchant-portal",
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
