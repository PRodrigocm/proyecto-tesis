import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuración para producción
  output: 'standalone',
  
  // Optimizaciones de imágenes
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Variables de entorno públicas
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  
  // Configuración experimental
  experimental: {
    // Optimizar el bundle del servidor
    serverComponentsExternalPackages: ['bcrypt', 'bcryptjs'],
  },
};

export default nextConfig;
