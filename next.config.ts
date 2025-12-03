import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Habilitar output standalone para Docker
  output: 'standalone',
  
  // Configuración experimental
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // Configuración de imágenes (si usas next/image con dominios externos)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
