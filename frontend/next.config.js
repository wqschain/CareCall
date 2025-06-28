/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com', 'avatars.githubusercontent.com'],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.carecall.club',
          },
        ],
        permanent: true,
        destination: 'https://carecall.club/:path*',
      },
    ];
  },
}

module.exports = nextConfig 