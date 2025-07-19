/**
 * Edit Course Page Component
 * Halaman untuk mengedit informasi kursus yang sudah ada
 * Memungkinkan user mengubah judul, deskripsi, level, durasi, dan gambar kursus
 */

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
import { useRef } from "react"

/**
 * Interface untuk data kursus yang akan diedit
 * Mendefinisikan struktur data yang diperlukan untuk form edit
 */
interface CourseData {
  courseId?: string        // ID kursus (alternatif)
  id?: string              // ID unik kursus
  title: string            // Judul kursus
  description: string      // Deskripsi kursus
  level: string            // Level kesulitan
  duration: string         // Durasi kursus
  lessons: number          // Jumlah lesson
  modules: any[]           // Array modul
  createdAt: string        // Tanggal pembuatan
  image?: string           // URL gambar kursus
}

/**
 * Edit Course Page Component
 * Component untuk mengedit informasi kursus
 * 
 * @returns JSX element untuk halaman edit kursus
 */
export default function EditCoursePage() {
  // Router dan params untuk navigasi dan mendapatkan ID kursus
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  
  // Supabase client untuk operasi database
  const supabase = createClientComponentClient();
  
  // State untuk menyimpan data kursus
  const [course, setCourse] = useState<CourseData | null>(null)
  
  // State untuk loading dan saving
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // State untuk form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    level: "",
    duration: ""
  })
  
  // State untuk gambar
  const [imageUrl, setImageUrl] = useState<string>(course?.image || "/placeholder.svg")
  const [uploading, setUploading] = useState(false)
  
  // Ref untuk file input
  const fileInputRef = useRef<HTMLInputElement>(null)

  /**
   * Load data kursus dari database
   * Mengambil informasi kursus berdasarkan ID dan memverifikasi kepemilikan
   */
  useEffect(() => {
    const fetchCourse = async () => {
      // Mengambil session user saat ini
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user?.id) {
        router.push("/login");
        return;
      }
      
      const userId = session.user.id;
      
      // Ambil data kursus dari database
      const { data: courseData, error } = await supabase.from("courses").select("*").eq("id", courseId).single();
      if (error || !courseData) {
        router.push("/dashboard/course");
        return;
      }
      
      // Kontrol akses: hanya pemilik yang bisa mengedit
      if (courseData.user_id !== userId) {
        alert("You do not have access to edit this course.");
        router.push("/dashboard/course");
        return;
      }
      
      // Set data kursus ke state
      setCourse(courseData as CourseData);
      setFormData({
        title: (courseData as CourseData).title || "",
        description: (courseData as CourseData).description || "",
        level: (courseData as CourseData).level || "Pemula",
        duration: (courseData as CourseData).duration || "8 minggu"
      });
      setImageUrl(courseData.image || "/placeholder.svg")
      setLoading(false);
    };
    
    fetchCourse();
  }, [courseId, router, supabase]);

  /**
   * Handler untuk menyimpan perubahan kursus
   * Saat ini hanya redirect, implementasi update database belum lengkap
   */
  const handleSave = async () => {
    if (!course) return
    
    setSaving(true)
    
    try {
      // TODO: Implementasi update ke database
      // Update course in localStorage
      // Removed all localStorage usage for generatedCourses
      // Fetch all data from Supabase or server instead.
      // For now, we'll just redirect after saving.
      // In a real application, you'd update in Supabase or an API.
      // For demonstration, we'll just redirect.
      router.push("/dashboard/course")
    } catch (error) {
      alert("Failed to save course. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  /**
   * Handler untuk upload dan mengganti gambar kursus
   * Upload gambar ke Supabase Storage dan update URL di database
   * 
   * @param e - Change event dari file input
   */
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !course) return
    
    setUploading(true)
    
    try {
      // Generate nama file unik
      const fileExt = file.name.split('.').pop()
      const filePath = `course-images/${course.id}-${Date.now()}.${fileExt}`
      
      // Upload ke Supabase Storage
      let { error: uploadError } = await supabase.storage.from('gambar').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      
      // Dapatkan public URL
      const { data } = supabase.storage.from('gambar').getPublicUrl(filePath)
      if (!data?.publicUrl) throw new Error('Gagal mendapatkan URL gambar')
      
      // Update state dan database
      setImageUrl(data.publicUrl)
      await supabase.from('courses').update({ image: data.publicUrl }).eq('id', course.id)
      alert('Gambar berhasil diupload!')
    } catch (err) {
      alert('Gagal upload gambar')
    } finally {
      setUploading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Error state jika kursus tidak ditemukan
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
      {/* Header section dengan back button dan title */}
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

      {/* Form edit kursus */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Kursus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section upload dan preview gambar */}
          <div className="space-y-2 flex flex-col items-center">
            <img src={imageUrl} alt={formData.title || "Course Image"} className="w-full max-w-xs h-48 object-cover rounded-lg border mb-2" />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleImageChange}
            />
            <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Mengupload..." : "Ganti Gambar"}
            </Button>
          </div>

          {/* Input judul kursus */}
          <div className="space-y-2">
            <Label htmlFor="title">Judul Kursus</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Masukkan judul kursus"
            />
          </div>

          {/* Input deskripsi kursus */}
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

          {/* Grid untuk level dan durasi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Select level kesulitan */}
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

            {/* Input durasi kursus */}
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

          {/* Action buttons */}
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

      {/* Informasi tambahan kursus */}
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