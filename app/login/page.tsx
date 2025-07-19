/**
 * Login Page Component
 * Halaman login untuk aplikasi AI Personal Course
 * Menyediakan form autentikasi dengan Supabase Auth
 */

"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { GraduationCap, Brain } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

/**
 * Login Page Component
 * Component ini menampilkan halaman login dengan:
 * - Form autentikasi email/password
 * - Integrasi dengan Supabase Auth
 * - Responsive design dengan split layout
 * - Error handling dan loading states
 * 
 * @returns JSX element untuk halaman login
 */
export default function LoginPage() {
  // Router untuk navigasi setelah login berhasil
  const router = useRouter()
  
  // State untuk form inputs
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  
  // State untuk UI
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Supabase client untuk autentikasi
  const supabase = createClientComponentClient()

  /**
   * Handler untuk submit form login
   * Melakukan autentikasi dengan Supabase dan menyimpan data user ke settings
   * 
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Melakukan sign in dengan email dan password
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data) {
        // Menyimpan data user ke tabel settings jika belum ada
        const userId = data.user?.id
        const emailVal = data.user?.email
        const fullName = data.user?.user_metadata?.full_name || ""
        
        if (userId && emailVal) {
          const { error: settingsError } = await supabase.from("settings").upsert({
            id: userId,
            email: emailVal,
            full_name: fullName
          }, { onConflict: "id" })
          
          if (settingsError) {
            // eslint-disable-next-line no-console
            console.error("Settings insert error:", settingsError)
          }
        }
        
        // Redirect ke dashboard setelah login berhasil
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Welcome Section (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 to-primary/10 items-center justify-center p-12">
        <div className="max-w-md text-center">
          {/* Logo dan icon */}
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-8">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
          
          {/* Welcome text */}
          <h1 className="text-3xl font-bold text-foreground mb-4">Selamat Datang di AI Personal Course</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Mulai perjalanan Anda untuk menguasai keterampilan baru dan raih potensi Anda dengan kursus berbasis AI kami.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md p-8 rounded-lg border border-border bg-card shadow-sm">
          {/* Mobile Logo (hanya tampil di mobile) */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Brain className="h-8 w-8 text-primary mr-2" />
            <span className="text-xl font-bold text-foreground">AI Personal Course</span>
          </div>

          {/* Tab Navigation untuk switch antara login/register */}
          <div className="flex mb-8">
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-r-none border border-r-0" asChild>
              <Link href="/login">Masuk</Link>
            </Button>
            <Button
              variant="ghost"
              className="flex-1 text-muted-foreground hover:text-foreground rounded-l-none border border-l-0"
              asChild
            >
              <Link href="/register">Daftar</Link>
            </Button>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Selamat datang kembali</h2>
            <p className="text-muted-foreground">Masukkan kredensial Anda untuk mengakses akun</p>
          </div>

          {/* Error message display */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email input */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Masukkan email Anda"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 h-12 border-border focus:border-primary"
                required
              />
            </div>

            {/* Password input */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Kata Sandi
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan kata sandi Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 h-12 border-border focus:border-primary"
                required
              />
            </div>

            {/* Submit button */}
            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium border border-primary/20"
              disabled={isLoading}
            >
              {isLoading ? "Masuk..." : "Masuk"}
            </Button>
          </form>

          {/* Link ke halaman register */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            {"Belum punya akun? "}
            <Link href="/register" className="text-primary hover:text-primary/90 font-medium">
              Daftar di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
