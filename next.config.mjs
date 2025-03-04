// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'sarepay-kyc.s3.amazonaws.com',
      'sarepay-kyc-production.s3.amazonaws.com',
      'avatars.dicebear.com',
      "rampadmindevbucket.s3.amazonaws.com"
    ],
  },
};

export default nextConfig;
