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

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const supabase = createClientComponentClient()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    if (formData.password !== formData.confirmPassword) {
      setError("Kata sandi tidak cocok");
      setIsLoading(false);
      return;
    }

    if (!/^[^@\s]+@[^@\s]+\.com$/.test(formData.email)) {
      setError("Hanya email dengan domain .com yang diizinkan untuk mendaftar.");
      setIsLoading(false);
      return;
    }

    try {
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
        // Insert into profil table if user id is available
        const userId = data.user?.id
        if (userId) {
          await supabase.from("profil").insert({
            id: userId,
            nama_lengkap: `${formData.firstName} ${formData.lastName}`,
            email: formData.email
          })
        }
        // Don't redirect immediately, show success message first
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

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 rounded-lg border border-border bg-card shadow-sm text-center">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Registrasi Berhasil!</h2>
          <p className="text-muted-foreground mb-4">
            Silakan masuk ke aplikasi menggunakan akun yang telah didaftarkan.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Welcome Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 to-primary/10 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-8">
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Bergabung dengan AI Personal Course</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Buat akun Anda dan mulai membangun pengalaman belajar secara mandiri dengan platform berbasis AI kami.
          </p>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md p-8 rounded-lg border border-border bg-card shadow-sm">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Brain className="h-8 w-8 text-primary mr-2" />
            <span className="text-xl font-bold text-foreground">AI Personal Course</span>
          </div>

          {/* Tab Navigation */}
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

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">Buat akun Anda</h2>
            <p className="text-muted-foreground">Isi data Anda untuk memulai</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium border border-primary/20"
              disabled={isLoading}
            >
              {isLoading ? "Membuat akun..." : "Buat Akun"}
            </Button>
          </form>

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
