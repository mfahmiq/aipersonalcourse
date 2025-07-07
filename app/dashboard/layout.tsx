"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { OverlayProvider } from "@/components/OverlayContext"
import { supabase } from "@/lib/supabase"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
      }
    };
    checkSession();
  }, [router])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  return (
    <OverlayProvider>
      <div className="flex h-screen bg-background">
        {/* Sidebar dihapus, navigasi utama ada di Navbar */}

        {/* Mobile overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* Main content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Navbar onMenuClick={toggleMobileMenu} />
          <main className="flex-1 overflow-auto p-4 pt-4">{children}</main>
        </div>
      </div>
    </OverlayProvider>
  )
}
