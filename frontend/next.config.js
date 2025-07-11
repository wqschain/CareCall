/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  images: {
    domains: ['carecall-media.s3.amazonaws.com'],
  },
  async rewrites() {
    return [
      {
        source: '/api/auth/login/email',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login/email`,
      },
      {
        source: '/api/auth/verify',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify`,
      },
      {
        source: '/api/auth/email/verify',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify`,
      },
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig 