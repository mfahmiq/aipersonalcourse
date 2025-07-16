"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface CourseData {
  courseId?: string
  id?: string
  title: string
  description: string
  level: string
  duration: string
  lessons: number
  modules: any[]
  createdAt: string
}

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const supabase = createClientComponentClient();
  
  const [course, setCourse] = useState<CourseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "",
    duration: ""
  })

  useEffect(() => {
    const fetchCourse = async () => {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user?.id) {
        router.push("/login");
        return;
      }
      const userId = session.user.id;
      // Fetch course from Supabase
      const { data: courseData, error } = await supabase.from("courses").select("*").eq("id", courseId).single();
      if (error || !courseData) {
        router.push("/dashboard/course");
        return;
      }
      // Access control: Only owner can edit
      if (courseData.user_id !== userId) {
        alert("You do not have access to edit this course.");
        router.push("/dashboard/course");
        return;
      }
      setCourse(courseData as CourseData);
      setFormData({
        title: (courseData as CourseData).title || "",
        description: (courseData as CourseData).description || "",
        level: (courseData as CourseData).level || "Pemula",
        duration: (courseData as CourseData).duration || "8 minggu"
      });
      setLoading(false);
    };
    fetchCourse();
  }, [courseId, router, supabase]);

  const handleSave = async () => {
    if (!course) return
    
    setSaving(true)
    
    try {
      // Update course in localStorage
      // Removed all localStorage usage for generatedCourses
      // Fetch all data from Supabase or server instead.
      // For now, we'll just redirect after saving.
      // In a real application, you'd update in Supabase or an API.
      // For demonstration, we'll just redirect.
      router.push("/dashboard/course")
    } catch (error) {
      console.error("Error saving course:", error)
      alert("Failed to save course. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">Kursus tidak ditemukan</h2>
        <Button asChild>
          <Link href="/dashboard/course">Kembali ke Daftar Kursus</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/course">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Kursus
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Kursus</h1>
          <p className="text-muted-foreground">Perbarui informasi kursus Anda</p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Kursus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Judul Kursus</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Masukkan judul kursus"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Masukkan deskripsi kursus"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Tingkat</Label>
              <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tingkat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pemula">Pemula</SelectItem>
                  <SelectItem value="Menengah">Menengah</SelectItem>
                  <SelectItem value="Lanjutan">Lanjutan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Durasi</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="cth: 8 minggu"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/course">Batal</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Course Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Kursus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Total Materi:</span>
              <span className="ml-2">{course.lessons}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Dibuat:</span>
              <span className="ml-2">{new Date(course.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 