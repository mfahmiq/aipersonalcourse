"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Clock, Play, Search, Filter, Plus, Sparkles, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import Cookies from "js-cookie"

// Tambahkan tipe Course agar nextLessonId dikenali
interface Course {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalLessons: number;
  completedLessons: number;
  duration: string;
  level: string;
  status: string;
  type: string;
  image: string;
  createdAt?: string;
  nextLessonId?: string;
}

export default function CoursePage() {
  const [courses, setCourses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterLevel, setFilterLevel] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      // Ambil user session
      const userId = Cookies.get("user_id");
      if (!userId) return;

      // Ambil outlines user
      const { data: outlines, error: outlinesError } = await supabase.from("outlines").select("id").eq("user_id", userId);
      if (outlinesError) {
        console.error("Outlines fetch error:", outlinesError);
        setCourses([]);
        return;
      }
      const outlineIds = outlines?.map((o: any) => o.id) || [];

      // Ambil data kursus user
      let coursesData: any[] = [];
      let coursesError: any = null;
      if (outlineIds.length > 0) {
        const { data: cData, error: cError } = await supabase
          .from("courses")
          .select("id, title, description, level, duration, image_url, created_at, outline_id")
          .in("outline_id", outlineIds);
        coursesData = cData || [];
        coursesError = cError;
        if (coursesError) console.error("Courses fetch error:", coursesError);
      }

      // Ambil progress user untuk setiap course
      const { data: progressData, error: progressError } = await supabase
        .from("user_progress")
        .select("course_id, progress_percentage, completed, lesson_id")
        .eq("user_id", userId);
      if (progressError) console.error("User progress fetch error:", progressError);

      // Gabungkan data kursus dan progress
      const formattedCourses = (coursesData || []).map((course: any) => {
        const progress = progressData?.find((p: any) => p.course_id === course.id);
        return {
          ...course,
          progress: progress?.progress_percentage ?? 0,
          completedLessons: Array.isArray(progress?.completed) ? progress.completed.length : 0,
          status: (progress?.progress_percentage ?? 0) === 100 ? "Completed" : (progress?.progress_percentage ?? 0) > 0 ? "In Progress" : "Not Started",
          type: "generated",
          nextLessonId: progress?.lesson_id || null,
        }
      })
      setCourses(formattedCourses)
    }
    fetchCourses()
  }, [])

  // Handle course deletion
  const handleDeleteCourse = async (courseId: string, courseType: string) => {
    if (confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      if (courseType === "generated") {
        // Hapus course dari Supabase
        await supabase.from("courses").delete().eq("id", courseId)
      }
      // Update local state
      setCourses(prevCourses => prevCourses.filter(course => {
        const realId = (course as any).courseId || course.id
        return realId !== courseId
      }))
    }
  }

  // Handle course editing
  const handleEditCourse = (courseId: string) => {
    router.push(`/dashboard/course/${courseId}/edit`)
  }

  // Filter courses based on search and filters
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = filterLevel === "all" || course.level === filterLevel
    const matchesStatus = filterStatus === "all" || course.status === filterStatus

    return matchesSearch && matchesLevel && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "In Progress":
        return "bg-emerald-500 text-white"
      case "Completed":
        return "bg-emerald-500 text-white"
      case "Not Started":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-blue-500 text-white"
      case "Intermediate":
        return "bg-yellow-500 text-white"
      case "Advanced":
        return "bg-red-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
          <p className="text-muted-foreground mt-1">Continue your learning journey with personalized courses</p>
        </div>
        <Button className="bg-primary hover:bg-primary-foreground text-primary-foreground hover:text-primary" asChild>
          <Link href="/dashboard/outline">
            <Plus className="h-4 w-4 mr-2" />
            Create New Course
          </Link>
        </Button>
      </div>

      {/* AI Generated Courses Warning */}
      {courses.some((course: any) => course.type === "generated") && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-amber-600 mt-0.5">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-sm">
              <div className="font-medium text-amber-800 mb-1">Peringatan Konten AI</div>
              <div className="text-amber-700">
                Beberapa course di daftar ini dibuat dengan AI menggunakan informasi web terkini untuk akurasi informasi. 
                Meskipun konten telah diverifikasi dari sumber terpercaya, 
                <strong> mohon periksa kembali informasi yang disajikan untuk memastikan relevansi dengan kebutuhan Anda.</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border focus:border-primary focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="w-[140px] border-border focus:border-primary">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] border-border focus:border-primary">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course, index) => {
          const realId = (course as any).courseId || course.id;
          return (
            <Card key={`${realId}-${course.type}-${index}`} className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow group">
            <div className="relative">
              <img
                src={course.image || "/placeholder.svg"}
                alt={course.title}
                className="w-full h-48 object-cover rounded-t-lg"
              />
              {course.type === "generated" && (
                <div className="absolute top-3 left-3">
                  <Badge className="bg-primary text-primary-foreground">
                    <Sparkles className="h-3 w-3 mr-1" />
                    AI Generated
                  </Badge>
                </div>
              )}
              <div className="absolute top-3 right-3 flex gap-2">
                <Badge className={getStatusColor(course.status)}>{course.status}</Badge>
                {course.type === "generated" && (
                  <>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0 bg-background/80 hover:bg-background"
                      onClick={() => handleEditCourse(realId)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 w-6 p-0 bg-destructive/80 hover:bg-destructive"
                      onClick={() => handleDeleteCourse(realId, course.type)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                {course.level && (
                  <Badge variant="outline" className={`border-border ${getLevelColor(course.level)}`}>{course.level}</Badge>
                )}
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Clock className="h-4 w-4" />
                  <span>{course.duration}</span>
                </div>
              </div>
              <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">{course.title}</CardTitle>
              <p className="text-muted-foreground text-sm line-clamp-2">{course.description}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              {course.progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-foreground">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                    {course.completedLessons} of {course.totalLessons} lessons completed
                  </div>
                </div>
              )}

                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20"
                  onClick={() => {
                    if (course.type === "generated") {
                      // Cari lesson berikutnya dari nextLessonId
                      const generatedCourses = JSON.parse(localStorage.getItem("generatedCourses") || "[]");
                      const found = generatedCourses.find((c: any) => (c.courseId || c.id) === realId);
                      // Cari lessonId yang belum selesai
                      let nextLessonId = course.nextLessonId;
                      if (!nextLessonId && found?.modules?.[0]?.lessons?.[0]?.id) {
                        nextLessonId = found.modules[0].lessons[0].id;
                      }
                      if (nextLessonId) {
                        router.push(`/dashboard/course/${realId}/learn/${nextLessonId}`);
                      }
                    } else {
                      router.push(`/dashboard/course/${realId}`);
                    }
                  }}
                  disabled={course.type === "generated" && !(() => {
                    const generatedCourses = JSON.parse(localStorage.getItem("generatedCourses") || "[]");
                    const found = generatedCourses.find((c: any) => (c.courseId || c.id) === realId);
                    return found?.modules?.[0]?.lessons?.[0]?.id;
                  })()}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {course.progress > 0 && course.progress < 100 ? "Continue Learning" : course.progress === 100 ? "Review Course" : "Start Course"}
              </Button>
            </CardContent>
          </Card>
          )
        })}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12 border border-border rounded-lg bg-card p-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No courses found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || filterLevel !== "all" || filterStatus !== "all"
              ? "Try adjusting your search or filters"
              : "Create your first course from an outline"}
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20" asChild>
            <Link href="/dashboard/outline">
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
