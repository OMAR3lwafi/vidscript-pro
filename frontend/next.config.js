/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['i.ytimg.com', 'img.youtube.com', 'p16-sign.tiktokcdn-us.com', 'pbs.twimg.com'],
  },
}

module.exports = nextConfig