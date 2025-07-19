/**
 * Theme Provider Component
 * Wrapper untuk next-themes provider yang mengelola dark/light mode
 * Memungkinkan aplikasi untuk beralih antara tema gelap dan terang
 */

'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

/**
 * Theme Provider Component
 * Component ini membungkus next-themes provider untuk mengelola tema aplikasi
 * 
 * @param children - React children yang akan menggunakan tema
 * @param props - Props tambahan untuk next-themes provider
 * @returns JSX element dengan theme provider
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
