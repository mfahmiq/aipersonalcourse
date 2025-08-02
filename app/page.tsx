"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen, Sparkles, MessageSquare, GraduationCap } from "lucide-react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import SparklesCanvas from "../components/SparklesCanvas"
import FloatingIconsBackground from "../components/FloatingIconsBackground"

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden z-20">
      {/* Sparkles Background Animation */}
      <SparklesCanvas />
      <FloatingIconsBackground />
      {/* Grid Pattern Overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 opacity-20 dark:opacity-10" aria-hidden="true">
        <svg className="w-full h-full" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" className="text-foreground/10" />
        </svg>
      </div>
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-background" />
            </div>
            <span className="font-bold text-xl text-foreground">AI Personal Course</span>
          </Link>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Masuk
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-foreground hover:bg-foreground/90 text-background">Daftar</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto max-w-4xl text-center">
            <div
              className={`transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              <Badge variant="secondary" className="mb-8 bg-muted text-muted-foreground border-0">
                <Sparkles className="h-4 w-4 mr-2" />
                Pembelajaran Berbasis AI
              </Badge>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
                <span className="text-primary relative">Belajar Tanpa Batas, Kapan Saja dan di Mana Saja
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-primary/20 rounded-full animate-pulse"></div>
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Buat outline kursus, konten, dan dapatkan bantuan AI untuk menguasai topik apapun secara efisien.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/register">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg group">
                    Mulai Belajar
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="px-8 py-3 text-lg border-border hover:border-border/80">
                  Lihat Demo
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

    </div>
  )
}
