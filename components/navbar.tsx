"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Bell, Search, Menu, LayoutDashboard, FileText, BookOpen, Settings, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { cn } from "@/lib/utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface NavbarProps {
  onMenuClick?: () => void
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const supabase = createClientComponentClient()
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  // Get the current page title based on the pathname
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dasbor"
    if (pathname === "/dashboard/outline") return "Outline Kursus"
    if (pathname === "/dashboard/course") return "Kursus"
    if (pathname === "/dashboard/settings") return "Pengaturan"
    return "Dasbor"
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      // Force a hard reload to clear any cached state
      window.location.replace("/")
    } catch (error) {
      // Hapus semua baris console.error
    }
  }

  const handleMobileToggle = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background text-foreground px-6">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={handleMobileToggle}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>

        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-background rounded-full"></div>
              </div>
              <span className="font-bold text-lg text-foreground hidden md:inline">AI Personal Course</span>
            </div>
            {/* Main Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-2 ml-6">
              <Link href="/dashboard" className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === "/dashboard"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}>
                Dasbor
              </Link>
              <Link href="/dashboard/outline" className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith("/dashboard/outline")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}>
                Outline
              </Link>
              <Link href="/dashboard/course" className={cn(
                "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith("/dashboard/course")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}>
                Kursus
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {isMounted && <ThemeToggle />}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={/* TODO: ambil avatar_url dari session jika ada */ undefined} alt="User avatar" />
                    <AvatarFallback>
                      {/* Bisa pakai icon user atau inisial jika ingin, tapi permintaan user: hapus tulisan profile */}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-muted-foreground">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0v.75a.75.75 0 01-.75.75h-13.5a.75.75 0 01-.75-.75v-.75z" />
                      </svg>
                    </AvatarFallback>
                  </Avatar>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">Pengaturan</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>Keluar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-card text-card-foreground border-r border-border z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 p-6 border-b border-border">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-background rounded-full"></div>
          </div>
          <span className="font-bold text-lg text-foreground">AI Personal Course</span>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === "/dashboard"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <LayoutDashboard className="h-5 w-5" />
                Dasbor
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/outline"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith("/dashboard/outline")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <FileText className="h-5 w-5" />
                Outline
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/course"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname.startsWith("/dashboard/course")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <BookOpen className="h-5 w-5" />
                Kursus
              </Link>
            </li>
            <li>
              <Link
                href="/dashboard/settings"
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === "/dashboard/settings"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Settings className="h-5 w-5" />
                Pengaturan
              </Link>
            </li>
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={() => {
              handleLogout()
              setSidebarOpen(false)
            }}
            className="w-full justify-start text-card-foreground hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Keluar
          </Button>
        </div>
      </div>
    </>
  )
}
