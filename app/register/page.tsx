/**
 * Register Page Component
 * Halaman registrasi untuk aplikasi AI Personal Course
 * Menyediakan form pendaftaran dengan validasi dan integrasi Supabase Auth
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
 * Register Page Component
 * Component ini menampilkan halaman registrasi dengan:
 * - Form pendaftaran lengkap (nama, email, password)
 * - Validasi email domain .com
 * - Integrasi dengan Supabase Auth
 * - Success state dan error handling
 * - Responsive design dengan split layout
 * 
 * @returns JSX element untuk halaman registrasi
 */
export default function RegisterPage() {
  // Router untuk navigasi setelah registrasi berhasil
  const router = useRouter()
  
  // State untuk form data
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  
  // State untuk UI
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  // Supabase client untuk autentikasi
  const supabase = createClientComponentClient()

  /**
   * Handler untuk perubahan input form
   * Mengupdate state formData berdasarkan input yang berubah
   * 
   * @param e - Change event dari input
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  /**
   * Handler untuk submit form registrasi
   * Melakukan validasi dan registrasi user dengan Supabase
   * 
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    // Validasi password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError("Kata sandi tidak cocok");
      setIsLoading(false);
      return;
    }

    // Validasi email domain (hanya .com yang diizinkan)
    if (!/^[^@\s]+@[^@\s]+\.com$/.test(formData.email)) {
      setError("Hanya email dengan domain .com yang diizinkan untuk mendaftar.");
      setIsLoading(false);
      return;
    }

    try {
      // Melakukan sign up dengan Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: `${formData.firstName} ${formData.lastName}`,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data) {
        setSuccess(true)
        
        // Menyimpan data user ke tabel settings jika user ID tersedia
        const userId = data.user?.id
        if (userId) {
          await supabase.from("settings").insert({
            id: userId,
            full_name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email
          })
        }
        
        // Redirect ke login setelah 2 detik untuk menampilkan success message
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      }
    } catch (error: any) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Success state - tampilkan pesan sukses
  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-lg border border-border bg-card shadow-sm text-center">
          {/* Success icon */}
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          
          {/* Success message */}
          <h2 className="text-2xl font-bold text-foreground mb-2">Registrasi Berhasil!</h2>
          <p className="text-muted-foreground mb-4">
            Silakan cek email Anda untuk link konfirmasi dan selesaikan pendaftaran.
          </p>
          <p className="text-sm text-muted-foreground">
            Mengarahkan ke halaman verifikasi...
          </p>
        </div>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-foreground mb-4">Bergabung dengan AI Personal Course</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Buat akun Anda dan mulai membangun pengalaman belajar personalisasi dengan platform berbasis AI kami.
          </p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md p-8 rounded-lg border border-border bg-card shadow-sm">
          {/* Mobile Logo (hanya tampil di mobile) */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Brain className="h-8 w-8 text-primary mr-2" />
            <span className="text-xl font-bold text-foreground">AI Personal Course</span>
          </div>

          {/* Tab Navigation untuk switch antara login/register */}
          <div className="flex mb-8">
            <Button
              variant="ghost"
              className="flex-1 text-muted-foreground hover:text-foreground rounded-r-none border border-r-0"
              asChild
            >
              <Link href="/login">Masuk</Link>
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground rounded-l-none border border-l-0" asChild>
              <Link href="/register">Daftar</Link>
            </Button>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Buat akun Anda</h2>
            <p className="text-muted-foreground">Isi data Anda untuk memulai</p>
          </div>

          {/* Error message display */}
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Register form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name inputs (grid layout) */}
            <div className="grid grid-cols-2 gap-4">
              {/* First name input */}
              <div>
                <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
                  Nama Depan
                </Label>
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Budi"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 h-12 border-border focus:border-primary"
                  required
                />
              </div>
              
              {/* Last name input */}
              <div>
                <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
                  Nama Belakang
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Santoso"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 h-12 border-border focus:border-primary"
                  required
                />
              </div>
            </div>

            {/* Email input */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Masukkan email Anda"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 h-12 border-border focus:border-primary"
                required
              />
            </div>

            {/* Password inputs */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Kata Sandi
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Buat kata sandi"
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 h-12 border-border focus:border-primary"
                required
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-foreground">
                Konfirmasi Kata Sandi
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Konfirmasi kata sandi"
                value={formData.confirmPassword}
                onChange={handleInputChange}
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
              {isLoading ? "Membuat akun..." : "Buat Akun"}
            </Button>
          </form>

          {/* Link to login page */}
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-primary hover:text-primary/90 font-medium">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
