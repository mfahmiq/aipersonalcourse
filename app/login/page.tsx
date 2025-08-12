"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Brain, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data) {
        // Insert into profil table if not exists
        const userId = data.user?.id
        const emailVal = data.user?.email
        const fullName = data.user?.user_metadata?.full_name || ""
        if (userId && emailVal) {
          const { error: profilError } = await supabase.from("profil").upsert({
            id: userId,
            email: emailVal,
            nama_lengkap: fullName
          }, { onConflict: "id" })
          if (profilError) {
            // eslint-disable-next-line no-console
            console.error("Profil insert error:", profilError)
          }
        }
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError("Password baru dan konfirmasi password tidak cocok")
      setIsLoading(false)
      return
    }

    if (newPassword.length < 6) {
      setError("Password minimal 6 karakter")
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newPassword
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error for missing service role key
        if (data.error && data.error.includes('Service role key')) {
          throw new Error('Fitur reset password belum dikonfigurasi. Silakan hubungi administrator untuk menambahkan SUPABASE_SERVICE_ROLE_KEY.')
        }
        throw new Error(data.error || 'Terjadi kesalahan')
      }

      setSuccess("Password berhasil diubah! Silakan login dengan password baru Anda.")
      setNewPassword("")
      setConfirmPassword("")
      
      // Kembali ke form login setelah 3 detik
      setTimeout(() => {
        setIsForgotPassword(false)
        setSuccess(null)
      }, 3000)

    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    setIsForgotPassword(false)
    setError(null)
    setSuccess(null)
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Welcome Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 to-primary/10 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-8">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Selamat Datang di AI Personal Course</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Mulai perjalanan Anda untuk menguasai keterampilan baru dan raih potensi Anda dengan kursus berbasis AI kami.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md p-8 rounded-lg border border-border bg-card shadow-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Brain className="h-8 w-8 text-primary mr-2" />
            <span className="text-xl font-bold text-foreground">AI Personal Course</span>
          </div>

          {/* Tab Navigation */}
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

          {!isForgotPassword ? (
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-foreground mb-2">Selamat datang kembali</h2>
                <p className="text-muted-foreground">Masukkan kredensial Anda untuk mengakses akun</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
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

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="link"
                    className="text-sm text-primary hover:text-primary/90 p-0 h-auto"
                    onClick={() => setIsForgotPassword(true)}
                  >
                    Lupa password?
                  </Button>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium border border-primary/20"
                  disabled={isLoading}
                >
                  {isLoading ? "Masuk..." : "Masuk"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <div className="mb-8">
                <Button
                  type="button"
                  variant="ghost"
                  className="p-0 h-auto text-muted-foreground hover:text-foreground mb-4"
                  onClick={handleBackToLogin}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke login
                </Button>
                <h2 className="text-2xl font-bold text-foreground mb-2">Reset Password</h2>
                <p className="text-muted-foreground">Masukkan email Anda dan password baru</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                  {success}
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <Label htmlFor="reset-email" className="text-sm font-medium text-foreground">
                    Email
                  </Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Masukkan email Anda"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 h-12 border-border focus:border-primary"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="new-password" className="text-sm font-medium text-foreground">
                    Password Baru
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Masukkan password baru"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="mt-1 h-12 border-border focus:border-primary"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Password minimal 6 karakter
                  </p>
                </div>

                <div>
                  <Label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                    Konfirmasi Password Baru
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Konfirmasi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="mt-1 h-12 border-border focus:border-primary"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium border border-primary/20"
                  disabled={isLoading}
                >
                  {isLoading ? "Mengubah Password..." : "Ubah Password"}
                </Button>
              </form>
            </>
          )}

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
