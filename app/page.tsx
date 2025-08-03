"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen, Sparkles, MessageSquare, GraduationCap, Play, X } from "lucide-react"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import SparklesCanvas from "../components/SparklesCanvas"
import FloatingIconsBackground from "../components/FloatingIconsBackground"

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

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
                <motion.div
                  animate={{
                    scale: [1, 1.05, 1],
                    boxShadow: [
                      "0 0 0 0 rgba(59, 130, 246, 0)",
                      "0 0 0 10px rgba(59, 130, 246, 0.1)",
                      "0 0 0 0 rgba(59, 130, 246, 0)"
                    ]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="px-8 py-3 text-lg border-border hover:border-border/80 relative group"
                    onClick={() => setShowDemo(true)}
                  >
                    <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    Lihat Demo
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Demo Modal */}
      {showDemo && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-background rounded-lg shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Demo AI Personal Course</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDemo(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative aspect-video">
              <iframe
                src="https://www.youtube.com/embed/2escUlpDoP4?autoplay=1"
                title="AI Personal Course Demo"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
