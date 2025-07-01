"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, BookOpen, Sparkles, MessageSquare } from "lucide-react"
import { useEffect, useState } from "react"

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-background rounded-full"></div>
            </div>
            <span className="font-bold text-xl text-foreground">AI Personal Course</span>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button className="bg-foreground hover:bg-foreground/90 text-background">Get Started</Button>
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
                AI-Powered Learning
              </Badge>

              <h1 className="text-5xl md:text-6xl font-bold mb-6 text-foreground leading-tight">
                Create Your Perfect{" "}
                <span className="text-primary relative">
                  Learning Journey
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-primary/20 rounded-full animate-pulse"></div>
                </span>
              </h1>

              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Generate personalized course outlines, content, and get AI assistance to master any topic efficiently.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link href="/register">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg group">
                    Start Learning
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Button variant="outline" size="lg" className="px-8 py-3 text-lg border-border hover:border-border/80">
                  Watch Demo
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 bg-background">
          <div className="container mx-auto max-w-6xl">
            <div
              className={`text-center mb-16 transition-all duration-1000 delay-300 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              <h2 className="text-4xl font-bold text-foreground mb-4">Everything You Need to Learn Effectively</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our AI-powered platform creates structured learning experiences with personalized content tailored to
                your goals.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              {[
                {
                  icon: BookOpen,
                  title: "Smart Course Generation",
                  description:
                    "AI creates comprehensive course outlines and content based on your learning objectives.",
                  delay: "delay-500",
                },
                {
                  icon: Sparkles,
                  title: "Personalized Content",
                  description: "Adaptive learning materials that adjust to your pace and learning style.",
                  delay: "delay-700",
                },
                {
                  icon: MessageSquare,
                  title: "AI Learning Assistant",
                  description: "Get instant answers and explanations from our intelligent chatbot as you learn.",
                  delay: "delay-900",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className={`transition-all duration-1000 ${feature.delay} ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                >
                  <div className="group hover:scale-105 transition-transform duration-300">
                    <div className="mb-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 bg-background">
          <div className="container mx-auto max-w-4xl text-center">
            <div
              className={`transition-all duration-1000 delay-500 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            >
              <h2 className="text-4xl font-bold text-foreground mb-6">Ready to Transform Your Learning?</h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
                Join thousands of learners who are already achieving their goals with AI Personal Course.
              </p>
              <Link href="/register">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg group">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-foreground text-background py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-background rounded-full"></div>
              </div>
              <span className="font-bold text-xl text-background">AI Personal Course</span>
            </div>
            <p className="text-background/60 text-center">© 2024 AI Personal Course. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
