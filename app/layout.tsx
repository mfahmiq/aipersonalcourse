import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { OverlayProvider } from "@/components/OverlayContext"
import { StagewiseToolbar } from "@stagewise/toolbar-next"
import { ReactPlugin } from "@stagewise-plugins/react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Personal Course",
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <OverlayProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            {children}
            <StagewiseToolbar 
              config={{
                plugins: [ReactPlugin]
              }}
            />
          </ThemeProvider>
        </OverlayProvider>
      </body>
    </html>
  )
}
