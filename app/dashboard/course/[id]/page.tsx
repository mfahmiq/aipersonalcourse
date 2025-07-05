"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, BookOpen, Clock, Play, Target, CheckCircle2, Share2, Download, Edit } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ViewCoursePage() {
  const { id } = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    // Load course from localStorage
    const savedCourses = JSON.parse(localStorage.getItem("generatedCourses") || "[]")
    const foundCourse = savedCourses.find((c: any) => {
      // Check both courseId and id fields
      return c.courseId === id || c.id === id
    })

    if (foundCourse) {
      // Ensure course has required fields
      const validatedCourse = {
        ...foundCourse,
        courseId: foundCourse.courseId || foundCourse.id,
        title: foundCourse.title || "Untitled Course",
        description: foundCourse.description || "No description available",
        modules: Array.isArray(foundCourse.modules) ? foundCourse.modules : [],
      }
      setCourse(validatedCourse)
    } else {
      // Course not found, redirect to courses page
      router.push("/dashboard/course")
    }
  }, [id, router])

  const handleShare = () => {
    // Copy course link to clipboard
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert("Course link copied to clipboard!")
  }

  const handleExport = () => {
    // Export course as JSON
    if (course) {
      const dataStr = JSON.stringify(course, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${course.title.replace(/\s+/g, "_")}_course.json`
      link.click()
    }
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8 bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
          <p className="text-muted-foreground mt-2">Please wait while we load your course.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/dashboard/course" className="flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Courses
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{course.title}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1 border-border text-foreground hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/50" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="gap-1 border-border text-foreground hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/50" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Course Title and Description */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{course.title}</h1>
        <p className="text-muted-foreground mt-2">{course.description}</p>
        {/* Tombol Start Learning */}
        {course.modules?.[0]?.lessons?.[0]?.id && (
          <Button
            onClick={() => router.push(`/dashboard/course/${course.courseId}/learn/${course.modules[0].lessons[0].id}`)}
            className="bg-primary text-primary-foreground mt-4"
          >
            Start Learning
          </Button>
        )}
      </div>

      {/* Course Content */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start border-b border-border bg-background p-0">
          <TabsTrigger value="overview" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Overview
          </TabsTrigger>
          <TabsTrigger value="modules" className="data-[state=active]:border-b-2 data-[state=active]:border-primary">
            Modules & Lessons
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            {/* Course Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border border-border shadow-sm bg-card text-card-foreground">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{Array.isArray(course.modules) ? course.modules.length : 0}</div>
                    <p className="text-sm text-muted-foreground">Modules</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border shadow-sm bg-card text-card-foreground">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-primary">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {Array.isArray(course.modules) ? course.modules.reduce((total: number, module: any) => total + (Array.isArray(module.lessons) ? module.lessons.length : 0), 0) : 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Lessons</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border shadow-sm bg-card text-card-foreground">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-primary">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">
                      {course.modules.reduce((total: number, module: any) => 
                        total + module.lessons.reduce((lessonTotal: number, lesson: any) => 
                          lessonTotal + (parseInt(lesson.duration) || 0), 0), 0
                      )} min
                    </div>
                    <p className="text-sm text-muted-foreground">Total Duration</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Course Overview */}
            <Card className="border border-border shadow-sm bg-card text-card-foreground">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Course Overview</h2>
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  <p>{course.description}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="modules" className="mt-6">
          <div className="space-y-6">
            {course.modules.map((module: any) => (
              <Card key={module.id} className="border border-border shadow-sm bg-card text-card-foreground">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Module {module.id}: {module.title}</h2>
                  <div className="space-y-4">
                    {module.lessons.map((lesson: any) => (
                      <div key={lesson.id} className="border border-border rounded-lg p-4 bg-background">
                        <h3 className="text-lg font-medium text-foreground mb-2">Lesson {lesson.id}: {lesson.title}</h3>
                        
                        {/* Main Content - Artikel Komprehensif */}
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-foreground mb-2">Content:</h4>
                          <div className="prose prose-sm max-w-none text-muted-foreground">
                            {typeof lesson.content === 'string' ? (
                              <div className="max-h-32 overflow-hidden relative">
                                <div className="text-sm text-muted-foreground leading-relaxed">
                                  {lesson.content.length > 300 
                                    ? `${lesson.content.substring(0, 300)}...` 
                                    : lesson.content
                                  }
                                </div>
                                {typeof lesson.content === 'string' && lesson.content.length > 300 && (
                                  <div className="absolute bottom-0 right-0 bg-gradient-to-l from-background to-transparent w-8 h-4"></div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">Content preview not available</p>
                            )}
                          </div>
                          
                          {/* Info tentang referensi */}
                          <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <span>Dengan referensi dari sumber terpercaya</span>
                          </div>
                        </div>

                        {/* Tombol untuk melihat lesson lengkap */}
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push(`/dashboard/course/${course.courseId}/learn/${lesson.id}`)}
                            className="text-xs"
                          >
                            View Full Lesson
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
