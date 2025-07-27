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

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

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

            <Button 
              type="submit" 
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium border border-primary/20"
              disabled={isLoading}
            >
              {isLoading ? "Masuk..." : "Masuk"}
            </Button>
          </form>

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
