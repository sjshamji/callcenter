/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React strict mode in production to avoid double effect runs
  reactStrictMode: process.env.NODE_ENV === 'development',
  
  // Configure image domains that can be used with next/image
  images: {
    domains: ['avatars.githubusercontent.com'],
  },
  
  // Configure webpack if needed
  webpack: (config) => {
    return config;
  },
}

module.exports = nextConfig 