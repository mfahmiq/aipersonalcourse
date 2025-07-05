import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { StagewiseToolbar } from "@stagewise/toolbar-next"
import { ReactPlugin } from "@stagewise-plugins/react"
import { OverlayProvider } from "@/components/OverlayContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Personal Course",
  description: "Personalized learning experiences powered by AI",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <OverlayProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            {children}
            {process.env.NODE_ENV === "development" && (
              <StagewiseToolbar config={{ plugins: [ReactPlugin] }} />
            )}
          </ThemeProvider>
        </OverlayProvider>
      </body>
    </html>
  )
}
