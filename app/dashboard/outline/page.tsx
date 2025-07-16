"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { FileText, Eye, Edit, Trash2, Clock, Sparkles, X, GraduationCap, Layers, BookOpen, Globe, ListOrdered } from "lucide-react"
import { useRouter } from "next/navigation"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { v4 as uuidv4 } from 'uuid'
import { generateOutline } from "@/lib/utils/gemini"
import { Portal } from "@/components/Portal"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function OutlinePage() {
  const router = useRouter()
  const [outlines, setOutlines] = useState<any[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    topic: "",
    degree: "",
    difficulty: "",
    duration: "",
    language: "",
    video: "",
    chapters: "",
  })
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [error, setError] = useState("")
  const supabase = createClientComponentClient();

  const cleanCorruptOutlines = (outlines: any[]) => {
    return outlines.filter((outline) => {
      if (!Array.isArray(outline.modulesList)) return false;
      for (const module of outline.modulesList) {
        if (!module || typeof module !== 'object' || typeof module.title !== 'string' || !Array.isArray(module.lessons)) return false;
        for (const lesson of module.lessons) {
          if (!lesson || typeof lesson !== 'object' || typeof lesson.title !== 'string') return false;
        }
      }
      return true;
    });
  };

  useEffect(() => {
    setIsMounted(true)
    // Fetch outlines from Supabase
    const fetchOutlines = async () => {
      const { data, error } = await supabase.from("outlines").select("*").order("id", { ascending: false })
      if (error) setError(error.message)
      else setOutlines(data || [])
    }
    fetchOutlines()
  }, [])

  if (!isMounted) return null

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Replace the existing generateOutlineContent function
  const generateOutlineContent = async (formData: any) => {
    try {
      const generatedOutline = await generateOutline(formData, process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
      // Add missing fields that were previously generated client-side if needed
      generatedOutline.id = uuidv4()
      if (!generatedOutline.createdAt) {
        generatedOutline.createdAt = new Date().toISOString();
      }
      if (!generatedOutline.status) {
        generatedOutline.status = "Draft"; // Default status
      }
      return generatedOutline
    } catch (err) {
      throw err
    }
  }


  const handleGenerateOutline = async () => {
    if (!formData.title || !formData.topic) {
      alert("Silakan isi minimal judul dan topik")
      return
    }

    setIsGenerating(true)

    try {
        const newOutline = await generateOutlineContent(formData)

        // Get user id from Supabase Auth
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) {
          setError("Pengguna belum login.");
          setIsGenerating(false);
          return;
        }
        // Insert into outlines table
        const modulesCount = Array.isArray(newOutline.modulesList) ? newOutline.modulesList.length : 0;
        const lessonsCount = Array.isArray(newOutline.modulesList)
          ? newOutline.modulesList.reduce((acc: number, m: any) => acc + (Array.isArray(m.lessons) ? m.lessons.length : 0), 0)
          : 0;
        const { error: dbError } = await supabase.from("outlines").insert({
          user_id: userId,
          title: newOutline.title,
          description: newOutline.description,
          topic: newOutline.topic,
          level: newOutline.level,
          duration: newOutline.duration,
          language: newOutline.language,
          degree: newOutline.degree,
          modules: modulesCount,
          lessons: lessonsCount,
          overview: newOutline.overview,
          modules_detail: newOutline.modulesList
        });
        if (dbError) {
          console.error("Supabase insert error:", dbError);
          setError("Gagal menyimpan outline: " + dbError.message);
          setIsGenerating(false);
          return;
        }
        // Refresh outlines list
        const { data, error } = await supabase.from("outlines").select("*").order("id", { ascending: false })
        if (error) {
          console.error("Supabase fetch error:", error);
          setError(error.message);
        } else {
          setOutlines(data || [])
        }
        // Reset form
        setFormData({
          title: "",
          topic: "",
          degree: "",
          difficulty: "",
          duration: "",
          language: "",
          video: "",
          chapters: "",
        })
        setShowGenerateModal(false)
    } catch (error) {
        // Error handling is done within generateOutlineContent
    } finally {
        setIsGenerating(false)
    }
  }

  const handleDeleteOutline = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus outline ini?")) {
      const { error } = await supabase.from("outlines").delete().eq("id", id);
      if (error) {
        alert("Gagal menghapus outline: " + error.message);
      } else {
        // Refresh outlines list from Supabase
        const { data, error: fetchError } = await supabase.from("outlines").select("*").order("id", { ascending: false });
        if (fetchError) {
          setError(fetchError.message);
        } else {
          setOutlines(data || []);
        }
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published":
        return "bg-foreground text-background"
      case "Draft":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Pemula":
      case "pemula":
        return "bg-primary/10 text-primary"
      case "Menengah":
      case "menengah":
        return "bg-primary/10 text-primary"
      case "Lanjutan":
      case "lanjutan":
        return "bg-primary/10 text-primary"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const handleEditClick = (id: string) => {
    router.push(`/dashboard/outline/${id}/edit`)
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md border border-border bg-card shadow-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full border border-border flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <CardTitle>Sedang Membuat Outline Kursus</CardTitle>
            <p className="text-sm text-muted-foreground">AI sedang membuat outline kursus personal Anda</p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-4">Proses ini mungkin memerlukan beberapa saat...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Daftar Outline Kursus</h1>
        <p className="text-muted-foreground mt-1">Buat dan kelola outline kursus yang dihasilkan AI untuk perjalanan belajar Anda.</p>
        <Button className="mt-4" onClick={() => setShowGenerateModal(true)}>
          <Sparkles className="h-4 w-4 mr-2" />
          Buat Outline Kursus
        </Button>
      </div>

      {/* Generate Course Outline Modal */}
      {showGenerateModal && (
        <Portal>
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-50 font-sans">
            <div className="bg-white border rounded-2xl shadow-2xl p-0 w-full max-w-xl max-h-[95vh] overflow-y-auto relative animate-fadeIn">
              <button
                type="button"
                className="absolute top-3 right-3 text-2xl text-blue-600 hover:text-blue-700 transition-colors"
                onClick={() => setShowGenerateModal(false)}
                aria-label="Close"
              >
                <X className="w-6 h-6 text-blue-600" />
              </button>
              <Card className="border-0 shadow-none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Buat Outline Kursus
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Jelaskan apa yang ingin Anda pelajari dan AI kami akan membuatkan outline kursus yang komprehensif untuk Anda.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title" className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-blue-600" /> Judul</Label>
                      <Input id="title" placeholder="Contoh: Pengantar Pengembangan Web" value={formData.title} onChange={e => handleInputChange("title", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="degree" className="flex items-center gap-2"><Layers className="w-5 h-5 text-blue-600" /> Bidang Studi</Label>
                      <Input id="degree" placeholder="Contoh: Informatika" value={formData.degree} onChange={e => handleInputChange("degree", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="difficulty" className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-blue-600" /> Tingkat Kesulitan</Label>
                      <Input id="difficulty" placeholder="Contoh: Pemula" value={formData.difficulty} onChange={e => handleInputChange("difficulty", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="duration" className="flex items-center gap-2"><Clock className="w-5 h-5 text-blue-600" /> Estimasi Durasi</Label>
                      <Input id="duration" placeholder="Contoh: 4 minggu" value={formData.duration} onChange={e => handleInputChange("duration", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="language" className="flex items-center gap-2"><Globe className="w-5 h-5 text-blue-600" /> Bahasa</Label>
                      <Input id="language" placeholder="Contoh: Indonesia" value={formData.language} onChange={e => handleInputChange("language", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label htmlFor="chapters" className="flex items-center gap-2"><ListOrdered className="w-5 h-5 text-blue-600" /> Jumlah Bab</Label>
                      <Input
                        id="chapters"
                        placeholder="5"
                        type="number"
                        min="1"
                        max="10"
                        value={formData.chapters}
                        onChange={(e) => handleInputChange("chapters", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label htmlFor="topic" className="flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600" /> Deskripsi Topik</Label>
                    <Textarea
                      id="topic"
                      placeholder="Jelaskan topik secara detail"
                      value={formData.topic}
                      onChange={e => handleInputChange("topic", e.target.value)}
                      className="mt-1 min-h-[100px] resize-y"
                      required
                    />
                  </div>
                  <Button
                    onClick={handleGenerateOutline}
                    className="bg-foreground hover:bg-foreground/90 text-background mt-6"
                    disabled={!formData.title || !formData.topic}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Buat Outline
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </Portal>
      )}

      {/* Your Outlines */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Outline Anda</h2>

        {Array.isArray(outlines) && outlines.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-card p-8 shadow-sm">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Belum ada outline yang dibuat</h3>
            <p className="text-muted-foreground mb-6">
              Buat outline kursus pertama Anda untuk memulai.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outlines.map((outline) => {
              const modulesDetail = Array.isArray(outline.modules_detail) ? outline.modules_detail : [];
              const modulesCount = modulesDetail.length;
              const lessonsCount = modulesDetail.reduce((acc: number, m: any) => acc + (Array.isArray(m.lessons) ? m.lessons.length : 0), 0);
              return (
              <Card key={outline.id} className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow group">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">
                      <Link href={`/dashboard/outline/${outline.id}`}>{outline.title}</Link>
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteOutline(outline.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    {outline.modules} Modul
                    <span className="mx-1">•</span>
                    {outline.lessons} Materi
                    <span className="mx-1">•</span>
                    {outline.duration}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm line-clamp-2">{typeof outline.description === "string" ? outline.description : ""}</p>
                  {outline.degree && (
                    <div className="text-sm text-muted-foreground">Bidang Studi: {outline.degree}</div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className={`border border-border ${getLevelColor(outline.level)}`}>
                      {typeof outline.level === "string" ? outline.level : "Unknown"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="w-full border border-border text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/50" asChild>
                      <Link href={`/dashboard/outline/${outline.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        Lihat
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="w-full border border-border text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/50" onClick={() => handleEditClick(outline.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

