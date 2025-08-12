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

interface CourseData {
  courseId?: string
  id?: string
  judul: string
  deskripsi: string
  tingkat: string
  durasi: string
  jumlah_materi: number
  modules: any[]
  createdAt: string
  gambar?: string
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
  const [imageUrl, setImageUrl] = useState<string>(course?.gambar || "/placeholder.svg")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      const { data: courseData, error } = await supabase.from("kursus").select("*").eq("id", courseId).single();
      if (error || !courseData) {
        router.push("/course");
        return;
      }
      // Access control: Only owner can edit
      if (courseData.pengguna_id !== userId) {
        alert("You do not have access to edit this course.");
        router.push("/course");
        return;
      }
      setCourse(courseData as CourseData);
      setFormData({
        title: (courseData as CourseData).judul || "",
        description: (courseData as CourseData).deskripsi || "",
        level: (courseData as CourseData).tingkat || "Pemula",
        duration: (courseData as CourseData).durasi || "8 minggu"
      });
              setImageUrl(courseData.gambar || "/placeholder.svg")
      setLoading(false);
    };
    fetchCourse();
  }, [courseId, router, supabase]);

  const handleSave = async () => {
    if (!course) return
    
    setSaving(true)
    
    try {
      // Update course in Supabase
      const { error } = await supabase
        .from("kursus")
        .update({
          judul: formData.title,
          deskripsi: formData.description,
          tingkat: formData.level,
          durasi: formData.duration,
          gambar: imageUrl
        })
        .eq("id", courseId);
      
      if (error) {
        throw error;
      }
      
      alert("Kursus berhasil diperbarui!");
      router.push("/course")
    } catch (error) {
      console.error("Error saving course:", error)
      alert("Gagal menyimpan kursus. Silakan coba lagi.")
    } finally {
      setSaving(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !course) return
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `course-images/${course.id}-${Date.now()}.${fileExt}`
      // Upload ke Supabase Storage
      let { error: uploadError } = await supabase.storage.from('gambar').upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      // Get public URL
      const { data } = supabase.storage.from('gambar').getPublicUrl(filePath)
      if (!data?.publicUrl) throw new Error('Gagal mendapatkan URL gambar')
      setImageUrl(data.publicUrl)
      // Update field image di tabel kursus
      await supabase.from('kursus').update({ gambar: data.publicUrl }).eq('id', course.id)
      alert('Gambar berhasil diupload!')
    } catch (err) {
      alert('Gagal upload gambar')
    } finally {
      setUploading(false)
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
          <Link href="/course">Kembali ke Daftar Kursus</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href="/course" className="flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Kursus
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">Edit Kursus</span>
          </div>
          <h1 className="text-3xl font-bold mb-1">Edit Kursus</h1>
          <p className="text-muted-foreground mb-6">Perbarui informasi kursus Anda</p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Kursus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload/Preview Gambar */}
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
              <Select value={formData.duration} onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih durasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-2 minggu">1-2 minggu</SelectItem>
                  <SelectItem value="2-4 minggu">2-4 minggu</SelectItem>
                  <SelectItem value="1-2 bulan">1-2 bulan</SelectItem>
                  <SelectItem value="2-3 bulan">2-3 bulan</SelectItem>
                  <SelectItem value="3-6 bulan">3-6 bulan</SelectItem>
                </SelectContent>
              </Select>
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
              <Link href="/course">Batal</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 