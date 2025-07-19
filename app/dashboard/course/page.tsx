/**
 * Course Page Component
 * Halaman utama untuk menampilkan dan mengelola semua kursus user
 * Menyediakan fitur pencarian, filter, dan navigasi ke kursus
 */

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
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

/**
 * Interface untuk data Course
 * Mendefinisikan struktur data kursus yang ditampilkan
 */
interface Course {
  id: string;                    // ID unik kursus
  title: string;                 // Judul kursus
  description: string;           // Deskripsi kursus
  progress: number;              // Progress pembelajaran (0-100)
  totalLessons: number;          // Total jumlah lesson
  completedLessons: number;      // Jumlah lesson yang sudah selesai
  duration: string;              // Durasi kursus
  level: string;                 // Level kesulitan
  status: string;                // Status kursus (Not Started, In Progress, Completed)
  type: string;                  // Tipe kursus (generated, manual)
  image: string;                 // URL gambar kursus
  createdAt?: string;            // Tanggal pembuatan
  nextLessonId?: string;         // ID lesson berikutnya
}

/**
 * Course Page Component
 * Component utama untuk menampilkan daftar kursus user
 * 
 * @returns JSX element untuk halaman kursus
 */
export default function CoursePage() {
  // State untuk menyimpan daftar kursus
  const [courses, setCourses] = useState<Course[]>([])
  
  // State untuk pencarian dan filter
  const [searchQuery, setSearchQuery] = useState("")
  const [filterLevel, setFilterLevel] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  
  // Router untuk navigasi
  const router = useRouter();
  
  // Supabase client untuk operasi database
  const supabase = createClientComponentClient();

  /**
   * Load courses dari Supabase database
   * Mengambil semua kursus milik user yang sedang login
   */
  useEffect(() => {
    const fetchCourses = async () => {
      // Mengambil session user saat ini
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user?.id) {
        setCourses([]);
        return;
      }
      
      const userId = session.user.id;
      
      // Query untuk mengambil kursus dari database
      const { data: coursesData, error } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        setCourses([]);
        return;
      }

      // Format data kursus untuk ditampilkan
      const formattedCourses = (coursesData || []).map((course: any) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        progress: course.progress ?? 0,
        totalLessons: course.lessons ?? 0,
        completedLessons: Array.isArray(course.completed_lessons) ? course.completed_lessons.length : 0,
        duration: course.duration ?? "",
        level: course.level ?? "",
        status: course.progress === 100 ? "Completed" : course.progress > 0 ? "In Progress" : "Not Started",
        type: course.type ?? "",
        image: course.image || "/placeholder.svg?height=200&width=300",
        createdAt: course.created_at
      }));
      
      setCourses(formattedCourses);
    };
    
    fetchCourses();
  }, []);

  /**
   * Handler untuk menghapus kursus
   * Menghapus kursus dari database dan update state lokal
   * 
   * @param courseId - ID kursus yang akan dihapus
   * @param courseType - Tipe kursus (untuk konfirmasi)
   */
  const handleDeleteCourse = async (courseId: string, courseType: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kursus ini? Tindakan ini tidak dapat dibatalkan.")) {
      // Hapus dari database Supabase
      const { error } = await supabase.from("courses").delete().eq("id", courseId);
      if (error) {
        alert("Gagal menghapus kursus: " + error.message);
        return;
      }
      
      // Update state lokal
      setCourses(prevCourses => prevCourses.filter(course => course.id !== courseId));
    }
  }

  /**
   * Handler untuk mengedit kursus
   * Navigasi ke halaman edit kursus
   * 
   * @param courseId - ID kursus yang akan diedit
   */
  const handleEditCourse = (courseId: string) => {
    router.push(`/dashboard/course/${courseId}/edit`)
  }

  /**
   * Filter kursus berdasarkan pencarian dan filter yang dipilih
   * Menggabungkan filter pencarian, level, dan status
   */
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLevel = filterLevel === "all" || course.level === filterLevel
    const matchesStatus = filterStatus === "all" || course.status === filterStatus

    return matchesSearch && matchesLevel && matchesStatus
  })

  /**
   * Mendapatkan warna badge berdasarkan status kursus
   * 
   * @param status - Status kursus
   * @returns Class CSS untuk warna badge
   */
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

  /**
   * Mendapatkan warna badge berdasarkan level kursus
   * 
   * @param level - Level kesulitan kursus
   * @returns Class CSS untuk warna badge
   */
  const getLevelColor = (level: string) => {
    switch (level) {
      case "Pemula":
        return "bg-blue-500 text-white"
      case "Menengah":
        return "bg-yellow-500 text-white"
      case "Lanjutan":
        return "bg-red-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="space-y-8">
      {/* Header section dengan title dan tombol buat kursus */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kursus Saya</h1>
          <p className="text-muted-foreground mt-1">Lanjutkan perjalanan belajar Anda dan kelola semua kursus di sini</p>
        </div>
        <Button className="bg-primary hover:bg-primary-foreground text-primary-foreground hover:text-primary" asChild>
          <Link href="/dashboard/outline">
            <Plus className="h-4 w-4 mr-2" />
            Buat Kursus Baru
          </Link>
        </Button>
      </div>

      {/* Warning untuk kursus yang dibuat dengan AI */}
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
                Kursus di daftar ini dibuat dengan AI yang memiliki kelemahan Halusinasi informasi.
                <strong> Mohon periksa kembali informasi yang disajikan untuk memastikan kebenaran informasi dan relevansi dengan kebutuhan Anda.</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search dan filter section */}
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kursus..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background border-border focus:border-primary focus-visible:ring-ring"
              />
            </div>
            
            {/* Filter dropdown */}
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] border-border focus:border-primary">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="Not Started">Belum Dimulai</SelectItem>
                  <SelectItem value="In Progress">Sedang Berjalan</SelectItem>
                  <SelectItem value="Completed">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid kursus */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course, index) => {
          const realId = (course as any).courseId || course.id;
          
          // Hitung persentase progress
          const percent = course.totalLessons > 0 ? Math.round((course.completedLessons / course.totalLessons) * 100) : 0;
          const displayPercent = Math.min(percent, 100);
          
          return (
            <Card key={`${realId}-${course.type}-${index}`} className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow group">
              {/* Image section dengan badge dan action buttons */}
              <div className="relative">
                <img
                  src={course.image || "/placeholder.svg"}
                  alt={course.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                
                {/* Badge untuk kursus yang dibuat AI */}
                {course.type === "generated" && (
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-primary text-primary-foreground">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Dibuat oleh AI
                    </Badge>
                  </div>
                )}
                
                {/* Action buttons di pojok kanan atas */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge className={getStatusColor(course.status)}>
                    {course.status === "Completed" ? "Selesai" : course.status === "In Progress" ? "Sedang Berjalan" : course.status === "Not Started" ? "Belum Dimulai" : course.status}
                  </Badge>
                  
                  {/* Edit dan delete buttons untuk kursus AI */}
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

              {/* Card header dengan informasi kursus */}
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

              {/* Card content dengan progress dan action button */}
              <CardContent className="space-y-4">
                {/* Progress bar */}
                {displayPercent > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-foreground">
                      <span>Progress</span>
                      <span>{displayPercent}%</span>
                    </div>
                    <Progress value={displayPercent} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {course.completedLessons} of {course.totalLessons} lessons completed
                    </div>
                  </div>
                )}

                {/* Action button berdasarkan status progress */}
                {course.progress === 0 ? (
                  // Button untuk memulai kursus baru
                  <Button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20"
                    onClick={async () => {
                      // Ambil lesson pertama dari database
                      const { data: firstLesson, error } = await supabase
                        .from("course_chapters")
                        .select("id")
                        .eq("course_id", realId)
                        .order("module_number", { ascending: true })
                        .order("number", { ascending: true })
                        .limit(1)
                        .single();
                      if (error || !firstLesson) {
                        alert("Tidak dapat menemukan lesson pertama untuk course ini.");
                        return;
                      }
                      router.push(`/dashboard/course/${realId}/learn/${firstLesson.id}`);
                    }}
                  >
                    Mulai Kursus
                  </Button>
                ) : course.progress < 100 ? (
                  // Button untuk melanjutkan kursus
                  <Button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20"
                    onClick={async () => {
                      // Ambil lesson pertama dari database
                      const { data: firstLesson, error } = await supabase
                        .from("course_chapters")
                        .select("id")
                        .eq("course_id", realId)
                        .order("module_number", { ascending: true })
                        .order("number", { ascending: true })
                        .limit(1)
                        .single();
                      if (error || !firstLesson) {
                        alert("Tidak dapat menemukan lesson pertama untuk course ini.");
                        return;
                      }
                      router.push(`/dashboard/course/${realId}/learn/${firstLesson.id}`);
                    }}
                  >
                    Lanjutkan
                  </Button>
                ) : (
                  // Button untuk meninjau kursus yang sudah selesai
                  <Button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20"
                    onClick={async () => {
                      // Ambil lesson pertama dari database
                      const { data: firstLesson, error } = await supabase
                        .from("course_chapters")
                        .select("id")
                        .eq("course_id", realId)
                        .order("module_number", { ascending: true })
                        .order("number", { ascending: true })
                        .limit(1)
                        .single();
                      if (error || !firstLesson) {
                        alert("Tidak dapat menemukan lesson pertama untuk course ini.");
                        return;
                      }
                      router.push(`/dashboard/course/${realId}/learn/${firstLesson.id}`);
                    }}
                  >
                    Tinjau
                  </Button>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty state ketika tidak ada kursus */}
      {filteredCourses.length === 0 && (
        <div className="text-center py-12 border border-border rounded-lg bg-card p-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Tidak ada kursus ditemukan</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || filterLevel !== "all" || filterStatus !== "all"
              ? "Coba ubah pencarian atau filter Anda"
              : "Buat kursus pertama Anda dari outline"}
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20" asChild>
            <Link href="/dashboard/outline">
              <Plus className="h-4 w-4 mr-2" />
              Buat Kursus
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
