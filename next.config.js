/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React strict mode in production to avoid double effect runs
  reactStrictMode: true,
  
  // Configure image domains that can be used with next/image
  images: {
    domains: ['storage.googleapis.com'],
  },
  
  // Configure webpack if needed
  webpack: (config) => {
    // Custom webpack config if needed
    return config;
  },
}

module.exports = nextConfig 