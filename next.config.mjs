/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress Leaflet window warnings during build
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false }
    return config
  },
}

export default nextConfig
