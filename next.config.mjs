import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // 開発時のダブルマウントを無効化して Leaflet の二重初期化を防ぐ
  reactStrictMode: false,
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'openstreetmap-tiles',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7日間
        },
      },
    },
  ],
})(nextConfig);
