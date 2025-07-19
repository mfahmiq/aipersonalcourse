/**
 * Theme Toggle Component
 * Component untuk beralih antara tema light, dark, dan system
 * Menggunakan dropdown menu dengan icon yang berubah sesuai tema aktif
 */

'use client'

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Theme Toggle Component
 * Component ini menyediakan dropdown menu untuk mengubah tema aplikasi
 * Menampilkan icon yang sesuai dengan tema saat ini (sun/moon)
 * 
 * @returns JSX element dengan theme toggle dropdown
 */
export function ThemeToggle() {
  // Hook untuk mengakses dan mengubah tema
  const { setTheme, theme, resolvedTheme } = useTheme()
  
  // State untuk memastikan component sudah mounted (menghindari hydration mismatch)
  const [isMounted, setIsMounted] = React.useState(false);
  
  // Set mounted state saat component mount
  React.useEffect(() => { setIsMounted(true); }, []);
  
  // Return null jika belum mounted untuk menghindari hydration error
  if (!isMounted) return null;

  // Menentukan tema yang sedang aktif
  const currentTheme = theme === "system" ? resolvedTheme : theme

  return (
    <DropdownMenu>
      {/* Trigger button dengan icon yang berubah sesuai tema */}
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          {currentTheme === "dark" ? (
            <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
          ) : (
            <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      
      {/* Dropdown menu dengan opsi tema */}
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 