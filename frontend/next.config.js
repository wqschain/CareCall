/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  },
  images: {
    domains: ['carecall-media.s3.amazonaws.com'],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return [
      {
        source: '/api/auth/login/email',
        destination: `${apiUrl}/api/auth/login/email`,
      },
      {
        source: '/api/auth/verify',
        destination: `${apiUrl}/api/auth/verify`,
      },
      {
        source: '/api/auth/email/verify',
        destination: `${apiUrl}/api/auth/verify`,
      },
      {
        source: '/api/auth/me',
        destination: `${apiUrl}/api/auth/me`,
      },
      {
        source: '/api/checkins/:path*',
        destination: `${apiUrl}/api/checkins/:path*`,
      },
      // Note: recipients routes are handled by frontend API routes for token forwarding
    ]
  },
}

module.exports = nextConfig 