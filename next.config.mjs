/** @type {import('next').NextConfig} */
const nextConfig = {
  // 開発時のダブルマウントを無効化して Leaflet の二重初期化を防ぐ
  reactStrictMode: false,
};

export default nextConfig;
