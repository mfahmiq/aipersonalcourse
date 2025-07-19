/**
 * Dashboard Layout Component
 * Layout utama untuk area dashboard aplikasi
 * Menyediakan autentikasi check, navbar, dan struktur layout
 */

"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { OverlayProvider } from "@/components/OverlayContext"
import { supabase } from "@/lib/supabase"

/**
 * Dashboard Layout Component
 * Component ini membungkus semua halaman dashboard dan menyediakan:
 * - Autentikasi check untuk memastikan user sudah login
 * - Navbar untuk navigasi utama
 * - Overlay provider untuk modal dan dialog
 * - Responsive layout dengan mobile menu
 * 
 * @param children - React children yang akan di-render dalam layout
 * @returns JSX element dengan layout dashboard
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Router untuk redirect jika tidak terautentikasi
  const router = useRouter()
  
  // State untuk mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  /**
   * Effect untuk mengecek session user saat component mount
   * Redirect ke login jika tidak ada session
   */
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    };
    checkSession();
  }, [router])

  /**
   * Toggle mobile menu open/close
   */
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <OverlayProvider>
      <div className="flex h-screen bg-background">
        {/* Sidebar dihapus, navigasi utama ada di Navbar */}

        {/* Mobile overlay untuk menutup menu saat klik di luar */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Navbar dengan toggle mobile menu */}
          <Navbar onMenuClick={toggleMobileMenu} />
          
          {/* Main content dengan padding dan scroll */}
          <main className="flex-1 overflow-auto p-4 pt-4">{children}</main>
        </div>
      </div>
    </OverlayProvider>
  )
}
