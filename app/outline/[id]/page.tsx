"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, BookOpen, Clock, Share2, Download, Edit, Play, Target, CheckCircle2, FileText, GraduationCap, Layers, Globe, ListOrdered, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { v4 as uuidv4, validate as uuidValidate } from "uuid"
import { safeParseJSON } from "@/lib/utils/jsonUtils"
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { generateOutline, generateLessonContent } from "@/lib/utils/gemini"
import { useOverlay } from "@/components/OverlayContext"
import { Portal } from "@/components/Portal"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { OUTLINE_PROMPT } from "@/lib/utils/prompts";
import { LESSON_CONTENT_PROMPT } from "@/lib/utils/prompts";

// Tambahkan fungsi delay
function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fungsi parsing code block dari markdown, <pre>, atau plain text
function extractCodeBlocks(content: string): string[] {
  const codeBlocks: string[] = []
  // Markdown triple backtick
  const mdRegex = /```([a-zA-Z0-9]*)\n([\s\S]*?)```/g
  let match
  while ((match = mdRegex.exec(content))) {
    codeBlocks.push(match[2])
  }
  // <pre> block
  const preRegex = /<pre>([\s\S]*?)<\/pre>/g
  while ((match = preRegex.exec(content))) {
    codeBlocks.push(match[1])
  }
  return codeBlocks
}

// Fungsi generate konten per lesson
async function generateLessonContentWrapper({ outlineData, module, lesson }: any) {
  const rawContent = await generateLessonContent({ outlineData, module, lesson }, process.env.NEXT_PUBLIC_GEMINI_API_KEY!, validateAndFixReferences)
  // Hapus prefix ```markdown jika ada
  let cleanedContent = rawContent.konten;
  if (typeof cleanedContent === 'string') {
    cleanedContent = cleanedContent.replace(/^```markdown\s*/i, '');
  }
  return { ...rawContent, konten: cleanedContent };
}

// Fungsi untuk validasi dan perbaikan referensi
async function validateAndFixReferences(content: string): Promise<string> {
  try {
    // Cari section referensi
    const referenceMatch = content.match(/(##?\s*Referensi?|##?\s*References?)([\s\S]*?)(?=##?\s*|$)/i)
    
    if (referenceMatch) {
      const referenceSection = referenceMatch[2]
      const lines = referenceSection.split('\n')
      const validatedLines = []
      
      for (const line of lines) {
        // Cari URL dalam baris
        const urlMatch = line.match(/\[(\d+)\]\s*(.*?)\s*-\s*(.*?)\s*-\s*(https?:\/\/[^\s]+)/)
        
        if (urlMatch) {
          const [fullMatch, number, title, author, url] = urlMatch
          
          // Validasi format URL sederhana
          const isValidUrl = validateUrlFormat(url)
          
          if (isValidUrl) {
            validatedLines.push(line)
          } else {
            // Jika URL tidak valid, coba perbaiki format
            const correctedUrl = fixUrlFormat(url)
            if (correctedUrl) {
              validatedLines.push(line.replace(url, correctedUrl))
            } else {
              // Hapus referensi yang tidak valid
            }
          }
        } else {
          // Baris tanpa URL, tetap tambahkan
          validatedLines.push(line)
        }
      }
      
      // Ganti section referensi dengan yang sudah divalidasi
      const validatedReferenceSection = validatedLines.join('\n')
      content = content.replace(referenceMatch[0], `## Referensi${validatedReferenceSection}`)
    }
    
    return content
  } catch (error) {
    return content
  }
}

// Fungsi untuk validasi format URL (tanpa HTTP request)
function validateUrlFormat(url: string): boolean {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch (error) {
    return false
  }
}

// Fungsi untuk memperbaiki format URL
function fixUrlFormat(url: string): string | null {
  try {
    // Jika URL tidak memiliki protocol, tambahkan https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`
    }
    
    // Validasi URL yang sudah diperbaiki
    const urlObj = new URL(url)
    return urlObj.toString()
  } catch (error) {
    return null
  }
}

// Helper untuk konversi durasi ke jam
function convertDurationToHours(duration: string): string {
  if (!duration) return "-";
  const lower = duration.toLowerCase();
  if (lower.includes("minggu")) {
    const match = lower.match(/(\d+)/);
    const weeks = match ? parseInt(match[1], 10) : 1;
    return `${weeks * 7 * 24}h`;
  }
  if (lower.includes("hari")) {
    const match = lower.match(/(\d+)/);
    const days = match ? parseInt(match[1], 10) : 1;
    return `${days * 24}h`;
  }
  if (lower.includes("jam") || lower.includes("hour")) {
    const match = lower.match(/(\d+)/);
    const hours = match ? parseInt(match[1], 10) : 1;
    return `${hours}h`;
  }
  return duration;
}

// Fungsi untuk generate konten lesson menggunakan Gemini
async function generateLessonContentGemini({ outlineData, module, lesson }: any) {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API key tidak ditemukan di environment variable");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
    },
  });
  const prompt = LESSON_CONTENT_PROMPT({ outlineData, module, lesson });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: 8192,
      temperature: 0.7,
    }
  });
  const content = result.response.text().trim();
  return {
    id: lesson.id,
    title: lesson.title,
    content,
  };
}

export default function ViewOutlinePage() {
  const { id } = useParams()
  const router = useRouter()
  const [outline, setOutline] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isCreatingCourse, setIsCreatingCourse] = useState(false)
  const [showRegenerateForm, setShowRegenerateForm] = useState(false)
  const [regenerateForm, setRegenerateForm] = useState<any>(null)
  const [regenerateSuccess, setRegenerateSuccess] = useState(false)
  const { isGenerating, setIsGenerating, generationProgress, setGenerationProgress } = useOverlay();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchOutline = async () => {
      const { data, error } = await supabase.from("outlines").select("*").eq("id", id).single();
      if (error || !data) {
        router.push("/outline");
    } else {
        console.log("Fetched outline data:", data);
        console.log("detail_modul:", data.detail_modul);
        
        // Parse detail_modul jika berupa string JSON
        let modulesList = [];
        if (data.detail_modul) {
          if (typeof data.detail_modul === 'string') {
            try {
              modulesList = JSON.parse(data.detail_modul);
            } catch (e) {
              console.error("Error parsing detail_modul:", e);
              modulesList = [];
            }
          } else if (Array.isArray(data.detail_modul)) {
            modulesList = data.detail_modul;
          }
        }
        
        console.log("Parsed modulesList:", modulesList);
        
        setOutline({
          ...data,
          modulesList: modulesList,
          learningGoals: typeof data.learning_goal === 'string' ? data.learning_goal.split(',').map((g: string) => g.trim()).filter(Boolean) : [],
        });
      }
    };
    if (id) fetchOutline();
  }, [id, router]);

  const handleEditClick = () => {
    router.push(`/outline/${id}/edit`)
  }

  const handleCreateCourse = async () => {
    if (!outline) {
      alert("Outline data not found.")
      return
    }
    // Hitung totalModules dan totalLessons sebelum mulai generate
    const totalModules = Array.isArray(outline.modulesList) ? outline.modulesList.length : 0;
    const totalLessons = Array.isArray(outline.modulesList)
      ? outline.modulesList.reduce((acc: number, m: any) => acc + (Array.isArray(m.materi) ? m.materi.length : 0), 0)
      : 0;
    setGenerationProgress({ module: 0, lesson: 0, totalModules, totalLessons, currentLessonName: "" });
    setIsGenerating(true);
    try {
      // Insert ke Supabase (course dulu)
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setIsGenerating(false);
        alert("User not authenticated.");
        return;
      }
      // Insert course ke tabel 'kursus'
      // Pastikan outline.id adalah UUID valid
      let outlineIdToUse = outline.id;
      if (!uuidValidate(outlineIdToUse)) {
        outlineIdToUse = uuidv4();
      }
      const { data: courseInsert, error: courseError } = await supabase
        .from("kursus")
        .insert([
          {
            pengguna_id: userId,
            outline_id: outlineIdToUse,
            judul: outline.judul,
            deskripsi: outline.deskripsi,
            tingkat: outline.tingkat,
            durasi: outline.durasi,
            jumlah_modul: totalModules,
            jumlah_materi: totalLessons,
            kemajuan: 0,
            ringkasan: outline.ringkasan,
            topik: outline.topik,
          },
        ])
        .select("id")
        .single();
      if (courseError || !courseInsert) {
        setIsGenerating(false);
        alert("Failed to save course: " + (courseError?.message || "Unknown error"));
        return;
      }
      const insertedCourseId = courseInsert.id;
      // Struktur awal course
      const course = {
        outlineId: outline.id,
        judul: outline.judul,
        deskripsi: outline.deskripsi,
        modules: [] as any[],
        createdAt: new Date().toISOString()
      }
      let lessonCount = 0
      for (let m = 0; m < (Array.isArray(outline.modulesList) ? outline.modulesList.length : 0); m++) {
        const module = outline.modulesList[m]
        const newModule = {
          id: module.id,
          judul: module.judul,
          materi: [] as any[]
        }
        for (let l = 0; l < (Array.isArray(module.materi) ? module.materi.length : 0); l++) {
          const lesson = module.materi[l]
          lessonCount++
          setGenerationProgress({
            ...generationProgress,
            module: m + 1,
            lesson: lessonCount,
            totalModules,
            totalLessons,
            currentLessonName: lesson?.judul || ""
          })
          // Generate konten lesson
          const lessonContent = await generateLessonContentWrapper({outlineData: outline, module, lesson})
          newModule.materi.push({
            ...lessonContent
          })
          // Insert ke tabel materi
          const { error: lessonInsertError } = await supabase.from("materi").insert({
            kursus_id: insertedCourseId,
            judul: lessonContent.judul,
            konten: lessonContent.konten,
            url_video: lesson.url_video,
            judul_modul: module.judul,
            nomor_modul: m + 1, // Index modul (mulai dari 1)
            nomor_materi: `${m + 1}.${l + 1}`, // Format: 1.1, 1.2, 2.1, 2.2, dst
          });
          if (lessonInsertError) {
            // Tangani error insert lesson (opsional: tampilkan notifikasi atau retry)
          }
          // Jeda 3 detik
          await delay(3000)
        }
        course.modules.push(newModule)
      }
      setIsGenerating(false);
              router.push(`/course`)
    } catch (e) {
      setIsGenerating(false)
      alert("Terjadi kesalahan saat generate course.")
    }
  }

  const handleShare = () => {
    // Copy outline link to clipboard
    const url = window.location.href
    navigator.clipboard.writeText(url)
    alert("Outline link copied to clipboard!")
  }

  const handleExport = () => {
    // Export outline as JSON
    if (outline) {
      const dataStr = JSON.stringify(outline, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${outline.judul.replace(/\s+/g, "_")}_outline.json`
      link.click()
    }
  }

  const handleOpenRegenerateModal = () => {
    setRegenerateForm({
      title: outline?.judul || "",
      degree: outline?.mata_pelajaran || "",
      difficulty: outline?.tingkat || "",
      duration: outline?.durasi || "",
      language: outline?.bahasa || "",
      chapters: outline?.jumlah_modul || 2,
      topic: outline?.deskripsi || "",
      goals: outline?.learning_goal || "",
      // tambahkan field lain jika ada
    });
    setShowRegenerateForm(true);
  };

  const handleRegenerateOutline = async (inputData?: any) => {
    let formData = inputData;
    
    // Jika tidak ada inputData, buat formData dari data outline yang ada
    if (!formData) {
      formData = {
        judul: outline?.judul || "",
        topik: outline?.topik || "",
        mata_pelajaran: outline?.mata_pelajaran || "",
        tingkat: outline?.tingkat || "",
        durasi: outline?.durasi || "",
        bahasa: outline?.bahasa || "",
        jumlah_modul: outline?.jumlah_modul || 2,
        deskripsi: outline?.deskripsi || "",
        ringkasan: outline?.ringkasan || ""
      };
    }
    
    if (!formData) {
      alert("Tidak dapat menemukan data untuk regenerasi outline.");
      return;
    }
    setIsRegenerating(true);
    try {
      const newOutlineData = await generateOutlineContent(formData);
      // Update the outline in Supabase
      // Pastikan hanya UUID valid yang dikirim ke kolom UUID
      let updatePayload = {
        judul: newOutlineData.judul,
        deskripsi: newOutlineData.deskripsi,
        topik: newOutlineData.topik,
        tingkat: newOutlineData.tingkat,
        durasi: newOutlineData.durasi,
        bahasa: newOutlineData.bahasa,
        ringkasan: newOutlineData.ringkasan,
        jumlah_modul: Array.isArray(newOutlineData.modulesList) ? newOutlineData.modulesList.length : 0,
        jumlah_materi: Array.isArray(newOutlineData.modulesList) ? newOutlineData.modulesList.reduce((acc: number, m: any) => acc + (Array.isArray(m.materi) ? m.materi.length : 0), 0) : 0,
        detail_modul: newOutlineData.modulesList,
        updatedAt: new Date().toISOString(),
      };
      // Sudah tidak ada assignment ke updatePayload untuk 'id' dan 'user_id'.
      const { error } = await supabase.from("outlines").update(updatePayload).eq('id', outline.id);
      if (error) {
        alert('Failed to update outline: ' + error.message);
        setIsRegenerating(false);
        return;
      }
      // Update local state
      setOutline({ ...newOutlineData, originalFormData: formData });
      setRegenerateSuccess(true);
      setShowRegenerateForm(false);
      setTimeout(() => {
        setRegenerateSuccess(false);
        setIsRegenerating(false);
        router.push('/outline'); // Tambahkan redirect ke halaman outline setelah regenerasi
      }, 2000);
    } catch (error) {
      alert("Failed to regenerate outline.");
      setIsRegenerating(false);
    }
  };

  // Fungsi generate konten outline dengan retry jika modules/lessons kosong
  const generateOutlineContent = async (formData: any, retryCount = 0) => {
    try {
      const generatedOutline = await generateOutline(formData, process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
      // Add missing fields if needed
      if (!generatedOutline.id) {
        generatedOutline.id = Date.now().toString()
      }
      if (!generatedOutline.createdAt) {
        generatedOutline.createdAt = new Date().toISOString()
      }
      if (!generatedOutline.status) {
        generatedOutline.status = "Draft"
      }
      // Validate modulesList and lessons
      if (!Array.isArray(generatedOutline.modulesList) || generatedOutline.modulesList.length === 0 || generatedOutline.modulesList.some((m: any) => !Array.isArray(m.materi) || m.materi.length === 0)) {
        if (retryCount < 3) {
          // Retry up to 3 times
          return await generateOutlineContent(formData, retryCount + 1)
        } else {
          throw new Error("Failed to generate outline with modules and lessons after 3 attempts.")
        }
      }
      // Ensure all modules have lessons array
      generatedOutline.modulesList = generatedOutline.modulesList.map((module: any) => ({
        ...module,
        materi: Array.isArray(module.materi) ? module.materi : []
      }))
      return generatedOutline
    } catch (err) {
      throw err
    }
  }

  const generateCourseContent = async (outlineData: any) => {
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-001",
        generationConfig: { maxOutputTokens: 8192 },
      });

      // Gunakan prompt dari prompts.ts
      const prompt = OUTLINE_PROMPT(outlineData);

      const result = await model.generateContent({ 
        contents: [{ 
          role: "user", 
          parts: [{ text: prompt }] 
        }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7,
        }
      });
      const response = result.response;
      let jsonString = response.text().trim();

      // Extract JSON from markdown code block if present
      const jsonMatch = jsonString.match(/```(?:json)?([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1].trim();
      }

      // Clean the JSON string
      jsonString = jsonString
        // Remove any trailing commas in arrays and objects
        .replace(/,(\s*[}\]])/g, '$1')
        // Remove excessive escaping of quotes
        .replace(/\\"/g, '"')
        // Remove any invalid control characters
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
        // Fix any missing quotes around property names
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
        // Remove any BOM characters
        .replace(/^\uFEFF/, '')
        // Remove any leading/trailing whitespace
        .trim()

      // Try to parse the cleaned JSON
      let generatedCourse
      try {
        generatedCourse = JSON.parse(jsonString)
      } catch (parseError) {
        
        // Try to fix common JSON issues
        jsonString = jsonString
          // Fix missing quotes around property names
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
          // Fix single quotes to double quotes
          .replace(/'/g, '"')
          // Remove any trailing commas
          .replace(/,(\s*[}\]])/g, '$1')
          // Remove any line breaks in strings
          .replace(/\n/g, ' ')
          // Remove any double spaces
          .replace(/\s+/g, ' ')
        
        generatedCourse = JSON.parse(jsonString)
      }

      // Add missing fields if needed
      generatedCourse.courseId = generatedCourse.courseId || uuidv4();
      generatedCourse.outlineId = generatedCourse.outlineId || outlineData.id;
      generatedCourse.createdAt = generatedCourse.createdAt || new Date().toISOString();

      // Validate and fix module & lesson structure
      if (Array.isArray(generatedCourse.modules)) {
        generatedCourse.modules = generatedCourse.modules.map((module: any) => ({
          id: module.id || `module-${uuidv4()}`,
          judul: module.judul || "Untitled Module",
          materi: Array.isArray(module.materi)
            ? module.materi.map((lesson: any) => ({
                id: lesson.id || `lesson-${uuidv4()}`,
                judul: lesson.judul || "Untitled Lesson",
                konten: lesson.konten || "",
              }))
            : [],
        }));
      }

      return generatedCourse;
    } catch (error) {
      throw error;
    }
  };

  if (!outline) {
    return (
      <div className="container mx-auto px-4 py-8 bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Loading...</h1>
          <p className="text-muted-foreground mt-2">Please wait while we load your outline.</p>
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
            <Link href="/outline" className="flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Outline
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{outline.judul}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="border-border bg-muted/50 text-muted-foreground">{outline.tingkat}</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{outline.durasi}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-border text-foreground hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/50"
            onClick={handleOpenRegenerateModal}
            disabled={isRegenerating}
          >
            {isRegenerating ? "Menghasilkan ulang..." : "Regenerasi Outline"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1 border-border text-foreground hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/50" onClick={handleEditClick}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button 
            className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20" 
            onClick={handleCreateCourse}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Membuat Kursus...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Buat Kursus
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Course Title and Description */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{outline.judul}</h1>
        <p className="text-muted-foreground mt-2">{outline.deskripsi}</p>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 text-center">
        <Card className="border border-border shadow-sm bg-card text-card-foreground">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {Array.isArray(outline.modulesList) ? outline.modulesList.length : 0}
              </div>
              <p className="text-sm text-muted-foreground">Modul</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm bg-card text-card-foreground">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {Array.isArray(outline.modulesList) ? outline.modulesList.reduce((acc: number, m: any) => acc + (Array.isArray(m.materi) ? m.materi.length : 0), 0) : 0}
              </div>
              <p className="text-sm text-muted-foreground">Materi</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Content Tabs */}
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-8 bg-muted/50 text-muted-foreground">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Ringkasan</TabsTrigger>
          <TabsTrigger value="modules" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Modul & Materi</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="border border-border shadow-sm bg-card">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Ringkasan Kursus</h2>
              {/* Hapus citation [angka, ...] di akhir kalimat overview */}
              <p className="text-muted-foreground leading-relaxed">{outline.ringkasan?.replace(/\s*\[[^\]]*\]/g, "")}</p>

              {outline.topik && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                  <h3 className="font-medium text-foreground mb-2">Fokus Topik</h3>
                  <p className="text-muted-foreground">{outline.topik}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <Card className="border border-border shadow-sm bg-card">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Daftar Modul</h2>
              <p className="text-muted-foreground mb-6">Rincian semua modul dan materi</p>

              <div className="space-y-8">
                {Array.isArray(outline.modulesList) ? outline.modulesList.map((module: any, mIdx: number) => (
                  (module && typeof module === 'object' && typeof module.judul === 'string' && Array.isArray(module.materi)) ? (
                    <div key={module.id || mIdx} className="space-y-4">
                      <div className="bg-muted/50 text-muted-foreground px-3 py-1 rounded-md border border-border inline-block text-sm font-medium">
                        Modul {mIdx + 1}
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">{module.judul}</h3>
                      <div className="space-y-3 pl-4 border-l-2 border-border">
                        {Array.isArray(module.materi) ? module.materi.map((lesson: any, lIdx: number) => (
                          (lesson && typeof lesson === 'object' && typeof lesson.judul === 'string') ? (
                            <div key={lesson.id || lIdx} className="flex items-center justify-between py-3 px-4 bg-card text-card-foreground rounded-lg border border-border hover:bg-accent/50 transition-colors">
                              <div className="flex items-center gap-3">
                                {/* <div className="text-sm font-medium text-foreground">{lesson.id}</div> */}
                                <div className="font-medium text-foreground">{lesson.judul}</div>
                              </div>
                              {/* Removed duration/time display here */}
                            </div>
                          ) : (
                            <div key={lIdx} className="text-destructive">Invalid lesson data</div>
                          )
                        )) : <div className="text-destructive">Invalid lessons data</div>}
                      </div>
                    </div>
                  ) : (
                    <div key={module.id || mIdx} className="text-destructive">Invalid module data</div>
                  )
                )) : <div className="text-destructive">Invalid modulesList data</div>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Regenerate Outline Modal */}
      {showRegenerateForm && regenerateForm && (
        <Portal>
          <div className="fixed inset-0 w-screen h-screen bg-black bg-opacity-40 flex flex-col items-center justify-center" style={{zIndex: 999999}}>
            <div className="bg-background border rounded-2xl shadow-2xl p-0 w-full max-w-xl max-h-[95vh] overflow-y-auto relative animate-fadeIn">
              <button
                type="button"
                className="absolute top-3 right-3 text-2xl text-blue-600 hover:text-blue-700 transition-colors"
                onClick={() => setShowRegenerateForm(false)}
                aria-label="Close"
              >
                <X className="w-6 h-6 text-blue-600" />
              </button>
              <form
                onSubmit={e => {
                  e.preventDefault()
                  setShowRegenerateForm(false)
                  // Convert form data to match expected format
                  const convertedFormData = {
                    judul: regenerateForm.title || "",
                    topik: regenerateForm.topic || "",
                    mata_pelajaran: regenerateForm.degree || "",
                    tingkat: regenerateForm.difficulty || "",
                    durasi: regenerateForm.duration || "",
                    bahasa: regenerateForm.language || "",
                    jumlah_modul: parseInt(regenerateForm.chapters) || 2,
                    deskripsi: regenerateForm.topic || outline?.deskripsi || "",
                    ringkasan: outline?.ringkasan || ""
                  }
                  handleRegenerateOutline(convertedFormData)
                }}
              >
                <div className="border-0 shadow-none">
                  <div className="px-8 pt-8">
                    <h2 className="text-2xl font-bold mb-4 text-center tracking-tight">Edit Data Outline</h2>
                  </div>
                  <div className="px-8 pb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="title" className="flex items-center gap-2 font-semibold text-foreground text-base"><GraduationCap className="w-5 h-5 text-blue-600" /> Judul</label>
                        <input
                          className="w-full border border-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base text-foreground bg-background"
                          value={regenerateForm.title || ""}
                          onChange={e => setRegenerateForm((f: any) => ({ ...f, title: e.target.value }))}
                          required
                          placeholder="Contoh: Pengantar Pengembangan Web"
                        />
                      </div>
                      <div>
                        <label htmlFor="degree" className="flex items-center gap-2 font-semibold text-foreground text-base"><Layers className="w-5 h-5 text-blue-600" /> Bidang Studi</label>
                        <input
                          className="w-full border border-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base text-foreground bg-background"
                          value={regenerateForm.degree || ""}
                          onChange={e => setRegenerateForm((f: any) => ({ ...f, degree: e.target.value }))}
                          placeholder="Contoh: Informatika"
                        />
                      </div>
                      <div>
                        <label htmlFor="difficulty" className="flex items-center gap-2 font-semibold text-foreground text-base"><BookOpen className="w-5 h-5 text-blue-600" /> Tingkat Kesulitan</label>
                        <input
                          className="w-full border border-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base text-foreground bg-background"
                          value={regenerateForm.difficulty || ""}
                          onChange={e => setRegenerateForm((f: any) => ({ ...f, difficulty: e.target.value }))}
                          placeholder="Contoh: Pemula"
                        />
                      </div>
                      <div>
                        <label htmlFor="duration" className="flex items-center gap-2 font-semibold text-foreground text-base"><Clock className="w-5 h-5 text-blue-600" /> Estimasi Durasi</label>
                        <input
                          className="w-full border border-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base text-foreground bg-background"
                          value={regenerateForm.duration || ""}
                          onChange={e => setRegenerateForm((f: any) => ({ ...f, duration: e.target.value }))}
                          placeholder="Contoh: 4 minggu"
                        />
                      </div>
                      <div>
                        <label htmlFor="language" className="flex items-center gap-2 font-semibold text-foreground text-base"><Globe className="w-5 h-5 text-blue-600" /> Bahasa</label>
                        <input
                          className="w-full border border-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base text-foreground bg-background"
                          value={regenerateForm.language || ""}
                          onChange={e => setRegenerateForm((f: any) => ({ ...f, language: e.target.value }))}
                          placeholder="Contoh: Indonesia"
                        />
                      </div>
                      <div>
                        <label htmlFor="chapters" className="flex items-center gap-2 font-semibold text-foreground text-base"><ListOrdered className="w-5 h-5 text-blue-600" /> Jumlah Bab</label>
                        <input
                          className="w-full border border-border rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base text-foreground bg-background"
                          value={regenerateForm.chapters || ""}
                          onChange={e => setRegenerateForm((f: any) => ({ ...f, chapters: e.target.value }))}
                          placeholder="5"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label htmlFor="topic" className="flex items-center gap-2 font-semibold text-foreground text-base"><FileText className="w-5 h-5 text-blue-600" /> Deskripsi Topik</label>
                      <textarea
                        className="w-full border border-border rounded-lg px-3 py-2 min-h-[100px] mt-1 focus:outline-none focus:ring-2 focus:ring-blue-400 text-base text-foreground bg-background resize-y"
                        value={regenerateForm.topic || ""}
                        onChange={e => setRegenerateForm((f: any) => ({ ...f, topic: e.target.value }))}
                        required
                        placeholder="Jelaskan topik secara detail"
                      />
                    </div>
                    {/* Removed Learning Goals section */}
                    <div className="flex gap-2 mt-6 justify-end">
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">Regenerasi</button>
                      <button type="button" className="px-4 py-2 border border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors" onClick={() => setShowRegenerateForm(false)}>Batal</button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </Portal>
      )}

      {isRegenerating && (
        <Portal>
          <div className="fixed inset-0 w-screen h-screen bg-black/50 dark:bg-black/70 flex flex-col items-center justify-center" style={{zIndex: 999999, pointerEvents: 'auto', top: 0, left: 0, right: 0, bottom: 0}}>
            <div className="bg-background p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-fadeIn min-w-[320px] max-w-xs border border-border">
              {regenerateSuccess ? (
                <>
                  <div className="w-12 h-12 mb-4 flex items-center justify-center">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div className="text-lg font-bold mb-2 text-primary">Regenerasi Outline Berhasil!</div>
                  <div className="text-muted-foreground text-sm text-center">Outline berhasil diperbarui.</div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 mb-4 flex items-center justify-center">
                    <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                  <div className="text-lg font-bold mb-2 text-foreground">Regenerasi outline...</div>
                  <div className="text-muted-foreground text-sm text-center">AI sedang membuat outline kursus baru Anda. Mohon tunggu sebentar.</div>
                </>
              )}
            </div>
          </div>
        </Portal>
      )}
    </div>
  )
}
