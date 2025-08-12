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

export default function EditOutlinePage() {
  const router = useRouter()
  const { id } = useParams()
  const outlineId = Array.isArray(id) ? id[0] : id
  const [isMounted, setIsMounted] = useState(false)
  const [formData, setFormData] = useState({
    judul: "",
    deskripsi: "",
    topik: "",
    mata_pelajaran: "",
    tingkat: "",
    durasi: "",
    bahasa: "",
    includeVideo: false,
    ringkasan: "",
    learningGoals: [] as string[],
  })
  const [modules, setModules] = useState<any[]>([])
  const supabase = createClientComponentClient();

  useEffect(() => {
    setIsMounted(true)
    const fetchOutline = async () => {
      const { data, error } = await supabase.from("outlines").select("*").eq("id", outlineId).single();
      if (error || !data) {
        router.push("/outline");
      } else {
      setFormData({
          judul: data.judul || "",
          deskripsi: data.deskripsi || "",
          topik: data.topik || "",
          mata_pelajaran: data.mata_pelajaran || "",
          tingkat: data.tingkat || "Menengah",
          durasi: data.durasi || "",
          bahasa: data.bahasa || "english",
          includeVideo: data.includeVideo || false,
          ringkasan: data.ringkasan || "",
          learningGoals: typeof data.learning_goal === 'string' ? data.learning_goal.split(',').map((g: string) => g.trim()).filter(Boolean) : [],
        });
        setModules(Array.isArray(data.detail_modul) ? data.detail_modul : []);
      }
    };
    if (outlineId) fetchOutline();
  }, [outlineId, router]);

  // Handle input changes
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle learning goals changes
  const handleLearningGoalChange = (index: number, value: string) => {
    const updatedGoals = [...formData.learningGoals]
    updatedGoals[index] = value
    setFormData((prev) => ({ ...prev, learningGoals: updatedGoals }))
  }

  // Add new learning goal
  const addLearningGoal = () => {
    setFormData((prev) => ({ ...prev, learningGoals: [...prev.learningGoals, ""] }))
  }

  // Remove learning goal
  const removeLearningGoal = (index: number) => {
    const updatedGoals = formData.learningGoals.filter((_, i) => i !== index)
    setFormData((prev) => ({ ...prev, learningGoals: updatedGoals }))
  }

  // Handle module title change
  const handleModuleTitleChange = (moduleIndex: number, value: string) => {
    const updatedModules = [...modules]
    updatedModules[moduleIndex].judul = value
    setModules(updatedModules)
  }

  // Handle lesson changes
  const handleLessonChange = (moduleIndex: number, lessonIndex: number, field: string, value: string) => {
    const updatedModules = [...modules]
    updatedModules[moduleIndex].materi[lessonIndex][field as "judul"] = value
    setModules(updatedModules)
  }

  // Add new lesson to a module
  const addLesson = (moduleIndex: number) => {
    const updatedModules = [...modules]
    updatedModules[moduleIndex].materi.push({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      judul: "",
    })
    setModules(updatedModules)
  }

  // Remove lesson from a module
  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = [...modules]
    updatedModules[moduleIndex].materi.splice(lessonIndex, 1)
    // Update lesson IDs
    updatedModules[moduleIndex].materi = updatedModules[moduleIndex].materi.map((lesson: any, idx: number) => ({
      ...lesson,
      id: `${updatedModules[moduleIndex].id}.${idx + 1}`,
    }))
    setModules(updatedModules)
  }

  // Add new module
  const addModule = () => {
    const newModuleId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
    setModules([
      ...modules,
      {
        id: newModuleId,
        judul: "",
        materi: [
          {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
            judul: "",
          },
        ],
      },
    ])
  }

  // Remove module
  const removeModule = (moduleIndex: number) => {
    const updatedModules = modules.filter((_, i) => i !== moduleIndex)
    setModules(updatedModules)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted) return;

    // Calculate updated stats
    const totalLessons = Array.isArray(modules) ? modules.reduce((total: number, module: any) => total + (Array.isArray(module.materi) ? module.materi.length : 0), 0) : 0;

    // Prepare update payload
    const updatePayload = {
      judul: formData.judul,
      deskripsi: formData.deskripsi,
      topik: formData.topik,
      mata_pelajaran: formData.mata_pelajaran,
      tingkat: formData.tingkat,
      durasi: formData.durasi,
      bahasa: formData.bahasa,
      ringkasan: formData.ringkasan,
      jumlah_modul: Array.isArray(modules) ? modules.length : 0,
      jumlah_materi: totalLessons,
      detail_modul: modules,
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase.from('outlines').update(updatePayload).eq('id', outlineId);
    if (error) {
      alert('Gagal memperbarui outline: ' + error.message);
      return;
    }

    alert('Outline berhasil diperbarui!');
    router.push(`/outline/${outlineId}`);
  };

  if (!isMounted) return null

  return (
    <div className="space-y-8 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href={`/outline/${outlineId}`} className="flex items-center gap-1 hover:text-foreground">
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
                    <Label htmlFor="judul">Judul</Label>
                    <Input id="judul" value={formData.judul} onChange={(e) => handleInputChange("judul", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="mata_pelajaran">Mata Pelajaran</Label>
                    <Input id="mata_pelajaran" value={formData.mata_pelajaran} onChange={(e) => handleInputChange("mata_pelajaran", e.target.value)} placeholder="Contoh: Teknik Informatika" />
                  </div>
                  <div>
                    <Label htmlFor="tingkat">Tingkat Kesulitan</Label>
                    <select 
                      id="tingkat"
                      value={formData.tingkat} 
                      onChange={(e) => {
                        handleInputChange("tingkat", e.target.value)
                      }}
                      className="w-full p-3 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all duration-200"
                    >
                      <option value="" className="text-muted-foreground">Pilih tingkat kesulitan</option>
                      <option value="Pemula" className="text-foreground">Pemula</option>
                      <option value="Menengah" className="text-foreground">Menengah</option>
                      <option value="Lanjutan" className="text-foreground">Lanjutan</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="durasi">Durasi Perkiraan</Label>
                    <select 
                      id="durasi"
                      value={formData.durasi} 
                      onChange={(e) => {
                        handleInputChange("durasi", e.target.value)
                      }}
                      className="w-full p-3 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all duration-200"
                    >
                      <option value="" className="text-muted-foreground">Pilih estimasi durasi</option>
                      <option value="1-2 minggu" className="text-foreground">1-2 minggu</option>
                      <option value="2-4 minggu" className="text-foreground">2-4 minggu</option>
                      <option value="1-2 bulan" className="text-foreground">1-2 bulan</option>
                      <option value="2-3 bulan" className="text-foreground">2-3 bulan</option>
                      <option value="3-6 bulan" className="text-foreground">3-6 bulan</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="bahasa">Bahasa</Label>
                    <Input id="bahasa" value={formData.bahasa} onChange={(e) => handleInputChange("bahasa", e.target.value)} placeholder="Contoh: Indonesia" />
                  </div>
                  <div>
                    <Label htmlFor="jumlah_modul">Jumlah Modul</Label>
                    <select 
                      id="jumlah_modul"
                      value={Array.isArray(modules) ? modules.length : 0} 
                      onChange={(e) => {
                        const newCount = parseInt(e.target.value)
                        // Logic untuk menambah/kurangi modul bisa ditambahkan di sini
                      }}
                      className="w-full p-3 border border-border bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring hover:bg-accent hover:text-accent-foreground cursor-pointer transition-all duration-200"
                    >
                      <option value="0">0 Modul</option>
                      <option value="1">1 Modul</option>
                      <option value="2">2 Modul</option>
                      <option value="3">3 Modul</option>
                      <option value="4">4 Modul</option>
                      <option value="5">5 Modul</option>
                      <option value="6">6 Modul</option>
                      <option value="7">7 Modul</option>
                      <option value="8">8 Modul</option>
                      <option value="9">9 Modul</option>
                      <option value="10">10 Modul</option>
                    </select>
                  </div>

                </div>
                <div>
                  <Label htmlFor="ringkasan">Ringkasan</Label>
                  <Textarea id="ringkasan" value={formData.ringkasan} onChange={(e) => handleInputChange("ringkasan", e.target.value)} rows={3} />
                </div>
                <div>
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea id="deskripsi" value={formData.deskripsi} onChange={(e) => handleInputChange("deskripsi", e.target.value)} rows={3} />
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
              {(Array.isArray(modules) ? modules : []).map((module, mIdx) => (
                <div key={module.id || mIdx} className="border rounded p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Input value={module.judul} onChange={e => handleModuleTitleChange(mIdx, e.target.value)} placeholder="Module Title" className="flex-1" />
                    <Button onClick={() => removeModule(mIdx)} type="button" variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <ul className="space-y-2">
                    {(Array.isArray(module.materi) ? module.materi : []).map((lesson: any, lIdx: number) => (
                      <li key={lesson.id || lIdx} className="flex items-center gap-2">
                        <Input value={lesson.judul} onChange={e => handleLessonChange(mIdx, lIdx, "judul", e.target.value)} placeholder="Lesson Title" className="flex-1" />
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
