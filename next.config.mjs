/**
 * Konfigurasi Next.js untuk aplikasi AI Course Generator
 * File ini berisi pengaturan untuk build, linting, dan optimasi gambar
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Konfigurasi ESLint - mengabaikan error ESLint saat build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Konfigurasi TypeScript - mengabaikan error TypeScript saat build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Konfigurasi gambar - menonaktifkan optimasi gambar Next.js
  // Berguna untuk development atau jika ingin mengoptimasi gambar secara manual
  images: {
    unoptimized: true,
  },
}

export default nextConfig
