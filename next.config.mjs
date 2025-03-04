// next.config.mjs
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
};

export default nextConfig;
