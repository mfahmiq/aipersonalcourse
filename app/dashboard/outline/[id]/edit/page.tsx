/**
 * Edit Outline Page Component
 * Halaman untuk mengedit outline kursus, termasuk judul, deskripsi, modul, dan lesson
 * Menyediakan form dinamis untuk mengelola struktur outline kursus
 */

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Trash2, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

/**
 * EditOutlinePage Component
 * Komponen utama untuk mengedit outline kursus
 * 
 * @returns JSX element untuk halaman edit outline
 */
export default function EditOutlinePage() {
  // Router dan params
  const router = useRouter()
  const { id } = useParams()
  const outlineId = Array.isArray(id) ? id[0] : id
  const [isMounted, setIsMounted] = useState(false)
  // State untuk form data outline
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    topic: "",
    degree: "",
    level: "",
    duration: "",
    language: "",
    includeVideo: false,
    overview: "",
    learningGoals: [] as string[],
  })
  // State untuk modul dan lesson
  const [modules, setModules] = useState<any[]>([])
  const supabase = createClientComponentClient();

  /**
   * Fetch outline dari database berdasarkan ID
   * Mengisi formData dan modules dari data outline
   */
  useEffect(() => {
    setIsMounted(true)
    const fetchOutline = async () => {
      const { data, error } = await supabase.from("outlines").select("*").eq("id", outlineId).single();
      if (error || !data) {
        router.push("/dashboard/outline");
      } else {
        setFormData({
          title: data.title || "",
          description: data.description || "",
          topic: data.topic || "",
          degree: data.degree || "",
          level: data.level || "Menengah",
          duration: data.duration || "",
          language: data.language || "english",
          includeVideo: data.includeVideo || false,
          overview: data.overview || "",
          learningGoals: typeof data.learning_goal === 'string' ? data.learning_goal.split(',').map((g: string) => g.trim()).filter(Boolean) : [],
        });
        setModules(Array.isArray(data.modules_detail) ? data.modules_detail : []);
      }
    };
    if (outlineId) fetchOutline();
  }, [outlineId, router]);

  /**
   * Handler untuk perubahan input form
   */
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  /**
   * Handler untuk perubahan learning goals
   */
  const handleLearningGoalChange = (index: number, value: string) => {
    const updatedGoals = [...formData.learningGoals]
    updatedGoals[index] = value
    setFormData((prev) => ({ ...prev, learningGoals: updatedGoals }))
  }

  /**
   * Menambah learning goal baru
   */
  const addLearningGoal = () => {
    setFormData((prev) => ({ ...prev, learningGoals: [...prev.learningGoals, ""] }))
  }

  /**
   * Menghapus learning goal
   */
  const removeLearningGoal = (index: number) => {
    const updatedGoals = formData.learningGoals.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, learningGoals: updatedGoals }))
  }

  /**
   * Handler perubahan judul modul
   */
  const handleModuleTitleChange = (moduleIndex: number, value: string) => {
    const updatedModules = [...modules]
    updatedModules[moduleIndex].title = value
    setModules(updatedModules)
  }

  /**
   * Handler perubahan lesson dalam modul
   */
  const handleLessonChange = (moduleIndex: number, lessonIndex: number, field: string, value: string) => {
    const updatedModules = [...modules]
    updatedModules[moduleIndex].lessons[lessonIndex][field as "title"] = value
    setModules(updatedModules)
  }

  /**
   * Menambah lesson baru ke modul
   */
  const addLesson = (moduleIndex: number) => {
    const updatedModules = [...modules]
    updatedModules[moduleIndex].lessons.push({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      title: "",
    })
    setModules(updatedModules)
  }

  /**
   * Menghapus lesson dari modul
   */
  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = [...modules]
    updatedModules[moduleIndex].lessons.splice(lessonIndex, 1)
    // Update lesson IDs
    updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.map((lesson: any, idx: number) => ({
      ...lesson,
      id: `${updatedModules[moduleIndex].id}.${idx + 1}`,
    }))
    setModules(updatedModules)
  }

  /**
   * Menambah modul baru
   */
  const addModule = () => {
    const newModuleId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    setModules([
      ...modules,
      {
        id: newModuleId,
        title: "",
        lessons: [
          {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
            title: "",
          },
        ],
      },
    ])
  }

  /**
   * Menghapus modul
   */
  const removeModule = (moduleIndex: number) => {
    const updatedModules = modules.filter((_, i) => i !== moduleIndex)
    setModules(updatedModules)
  }

  /**
   * Handler submit form untuk update outline ke database
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted) return;
    // Hitung total lesson
    const totalLessons = Array.isArray(modules) ? modules.reduce((total: number, module: any) => total + (Array.isArray(module.lessons) ? module.lessons.length : 0), 0) : 0;
    // Payload update
    const updatePayload = {
      title: formData.title,
      description: formData.description,
      topic: formData.topic,
      degree: formData.degree,
      level: formData.level,
      duration: formData.duration,
      language: formData.language,
      overview: formData.overview,
      modules: Array.isArray(modules) ? modules.length : 0,
      lessons: totalLessons,
      modules_detail: modules,
      updatedAt: new Date().toISOString(),
    };
    const { error } = await supabase.from('outlines').update(updatePayload).eq('id', outlineId);
    if (error) {
      alert('Gagal memperbarui outline: ' + error.message);
      return;
    }
    alert('Outline berhasil diperbarui!');
    router.push(`/dashboard/outline/${outlineId}`);
  };

  if (!isMounted) return null

  return (
    <div className="space-y-8 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href={`/dashboard/outline/${outlineId}`} className="flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Outline
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Edit Outline</h1>
        </div>
      </div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="modules">Modul & Materi</TabsTrigger>
          {/* <TabsTrigger value="goals">Learning Goals</TabsTrigger> */}
          {/* <TabsTrigger value="breakdown">Course Modules</TabsTrigger> */}
        </TabsList>
        {/* Overview Tab */}
        <TabsContent value="overview">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="border border-border bg-card text-foreground shadow-none dark:bg-card dark:text-foreground dark:border-border">
              <CardHeader>
                <CardTitle>Edit Ringkasan Outline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title">Judul</Label>
                    <Input id="title" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="degree">Jurusan/Bidang</Label>
                    <Input id="degree" value={formData.degree} onChange={(e) => handleInputChange("degree", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="level">Tingkat Kesulitan</Label>
                    <Input id="level" value={formData.level} onChange={e => handleInputChange("level", e.target.value)} placeholder="Contoh: Pemula, Menengah, Lanjutan" />
                  </div>
                  <div>
                    <Label htmlFor="duration">Durasi Perkiraan</Label>
                    <Input id="duration" value={formData.duration} onChange={(e) => handleInputChange("duration", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="language">Bahasa</Label>
                    <Input id="language" value={formData.language} onChange={(e) => handleInputChange("language", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="modules">Jumlah Bab</Label>
                    <Input id="modules" value={Array.isArray(modules) ? modules.length : 0} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="lessons">Jumlah Materi</Label>
                    <Input id="lessons" value={Array.isArray(modules) ? modules.reduce((total, m) => total + (Array.isArray(m.lessons) ? m.lessons.length : 0), 0) : 0} readOnly />
                  </div>
                </div>
                <div>
                  <Label htmlFor="overview">Ringkasan</Label>
                  <Textarea id="overview" value={formData.overview} onChange={(e) => handleInputChange("overview", e.target.value)} rows={3} />
                </div>
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} rows={3} />
                </div>
                <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 mt-4">Simpan Ringkasan</Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
        {/* Modules & Lessons Tab */}
        <TabsContent value="modules">
          <Card className="border border-border bg-card text-foreground shadow-none">
            <CardHeader><CardTitle>Modul & Materi</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <Button onClick={addModule} type="button" className="mb-4">+ Tambah Modul</Button>
              {modules.map((module, mIdx) => (
                <div key={module.id || mIdx} className="border rounded p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Input value={module.title} onChange={e => handleModuleTitleChange(mIdx, e.target.value)} placeholder="Module Title" className="flex-1" />
                    <Button onClick={() => removeModule(mIdx)} type="button" variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <ul className="space-y-2">
                    {module.lessons.map((lesson: any, lIdx: number) => (
                      <li key={lesson.id || lIdx} className="flex items-center gap-2">
                        <Input value={lesson.title} onChange={e => handleLessonChange(mIdx, lIdx, "title", e.target.value)} placeholder="Lesson Title" className="flex-1" />
                        <Button onClick={() => removeLesson(mIdx, lIdx)} type="button" variant="destructive" size="icon"><X className="h-4 w-4" /></Button>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => addLesson(mIdx)} type="button" size="sm" className="mt-2">+ Tambah Materi</Button>
                </div>
              ))}
              <Button onClick={handleSubmit} type="submit" className="mt-4"><Save className="mr-2 h-4 w-4" />Simpan Modul & Materi</Button>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Removed Course Modules Breakdown Tab */}
        {/* <TabsContent value="breakdown"> ... </TabsContent> */}
      </Tabs>
    </div>
  )
}
