/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    BACKEND_URL: process.env.BACKEND_URL,
  },
  images: {
    domains: ['carecall-media.s3.amazonaws.com'],
  },
}

module.exports = nextConfig 