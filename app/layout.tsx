/**
 * Root Layout Component
 * File ini mendefinisikan layout utama aplikasi Next.js
 * Berisi provider-provider global dan konfigurasi dasar
 */

import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { StagewiseToolbar } from "@stagewise/toolbar-next"
import { ReactPlugin } from "@stagewise-plugins/react"
import { OverlayProvider } from "@/components/OverlayContext"

// Menggunakan font Inter dari Google Fonts
const inter = Inter({ subsets: ["latin"] })

// Metadata untuk SEO dan informasi aplikasi
export const metadata: Metadata = {
  title: "AI Personal Course",
  description: "Personalized learning experiences powered by AI",
  generator: 'v0.dev'
}

/**
 * Root Layout Component
 * Component ini membungkus seluruh aplikasi dan menyediakan:
 * - Font Inter untuk konsistensi tipografi
 * - Theme provider untuk dark/light mode
 * - Overlay provider untuk modal dan dialog
 * - Stagewise toolbar untuk development
 * 
 * @param children - React children yang akan di-render
 * @returns JSX element dengan layout utama
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* Provider untuk overlay/modal management */}
        <OverlayProvider>
          {/* Provider untuk theme management (dark/light mode) */}
          <ThemeProvider 
            attribute="class" 
            defaultTheme="light" 
            enableSystem 
            disableTransitionOnChange
          >
            {/* Konten utama aplikasi */}
            {children}
            
            {/* Stagewise toolbar hanya muncul di development mode */}
            {process.env.NODE_ENV === "development" && (
              <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
            )}
          </ThemeProvider>
        </OverlayProvider>
      </body>
    </html>
  )
}
