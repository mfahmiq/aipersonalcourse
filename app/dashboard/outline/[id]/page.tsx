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
import { v4 as uuidv4 } from "uuid"
import { safeParseJSON } from "@/lib/utils/jsonUtils"
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

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
async function generateLessonContent({
  outlineData,
  module,
  lesson
}: {
  outlineData: any,
  module: any,
  lesson: any
}) {
  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-001",
    generationConfig: { maxOutputTokens: 8192 },
  })

  // PROMPT BARU: instruksikan AI untuk SELALU menyertakan contoh kode dalam format markdown code block jika applicable
  const prompt = `Buatkan artikel lengkap dan komprehensif untuk lesson berikut:

**INFORMASI COURSE:**
- Judul Course: ${outlineData.title}
- Deskripsi: ${outlineData.description}
- Topik Utama: ${outlineData.topic}
- Level: ${outlineData.level}
- Durasi: ${outlineData.duration}
- Bahasa: ${outlineData.language}
- Tujuan Pembelajaran: ${outlineData.learningGoals?.join("; ")}

**INFORMASI MODULE & LESSON:**
- Module: ${module.title}
- Lesson: ${lesson.title}
- Durasi Lesson: ${lesson.duration}

**PETUNJUK PENULISAN:**
1. **Gunakan pengetahuan terkini** tentang topik lesson
2. **Sertakan sitasi** pada setiap bagian konten dengan format [1], [2], [3], dst
3. **Buat referensi lengkap** di akhir artikel dengan link sumber yang VALID
4. **Pastikan akurasi** informasi berdasarkan sumber terpercaya
5. **Jika applicable, SELALU sertakan contoh kode dalam format markdown code block (misal: \`\`\`javascript ... \`\`\`) pada bagian yang relevan. Jika tidak ada, tulis 'Tidak ada contoh kode.'**

**STRUKTUR ARTIKEL YANG DIHARAPKAN:**
1. **Pendahuluan** - Perkenalkan topik dan relevansinya [sertakan sitasi]
2. **Konsep Dasar** - Jelaskan teori dan prinsip fundamental [sertakan sitasi]
3. **Penjelasan Detail** - Uraikan setiap aspek dengan mendalam [sertakan sitasi]
4. **Contoh Praktis** - Berikan contoh nyata dan studi kasus [sertakan sitasi]
5. **Aplikasi** - Tunjukkan bagaimana konsep diterapkan [sertakan sitasi]
6. **Best Practices** - Berikan tips dan praktik terbaik [sertakan sitasi]
7. **Pitfalls & Solusi** - Jelaskan kesalahan umum dan cara menghindarinya [sertakan sitasi]
8. **Ringkasan** - Rangkum poin-poin penting
9. **Referensi** - Daftar lengkap sumber dengan link yang VALID

**FORMAT OUTPUT:**
- Gunakan Markdown dengan struktur yang rapi
- Sertakan sitasi [1], [2], [3] di setiap bagian yang menggunakan sumber
- Di akhir artikel, tambahkan section "Referensi" dengan format:
  [1] Judul Artikel/Sumber - Penulis - URL (pastikan URL valid)
  [2] Judul Artikel/Sumber - Penulis - URL (pastikan URL valid)
  dst
- **Jika ada contoh kode, SELALU gunakan markdown code block (misal: \`\`\`javascript ... \`\`\`).**

**PENTING - VALIDASI LINK:**
- Hanya gunakan URL yang benar dan dapat diakses
- Pastikan format URL lengkap (https://domain.com/path)
- Hindari URL yang tidak valid atau broken links
- Gunakan sumber terpercaya seperti website resmi, jurnal, atau platform edukasi`

  try {
    const result = await model.generateContent({ 
      contents: [{ 
        role: "user", 
        parts: [{ text: prompt }] 
      }],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      }
    })
    
    let content = result.response.text().trim()
    // Jika ada blok markdown, ambil isinya
    const mdMatch = content.match(/```(?:md|markdown)?([\s\S]*?)```/)
    if (mdMatch && mdMatch[1]) {
      content = mdMatch[1].trim()
    }
    // Validasi dan perbaiki link referensi
    content = await validateAndFixReferences(content)
    return {
      id: lesson.id,
      title: lesson.title,
      content,
    }
  } catch (error) {
    console.error("Error generating lesson content:", error)
    throw error
  }
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
              console.warn(`Removing invalid reference: ${title} - ${url}`)
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
    console.error("Error validating references:", error)
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

export default function ViewOutlinePage() {
  const { id } = useParams()
  const router = useRouter()
  const [outline, setOutline] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isCreatingCourse, setIsCreatingCourse] = useState(false)
  const [generationProgress, setGenerationProgress] = useState({module: 0, lesson: 0, totalModules: 0, totalLessons: 0})
  const [isGenerating, setIsGenerating] = useState(false)
  const [showRegenerateForm, setShowRegenerateForm] = useState(false)
  const [regenerateForm, setRegenerateForm] = useState<any>(null)
  const [regenerateSuccess, setRegenerateSuccess] = useState(false)

  useEffect(() => {
    // Load outline from localStorage
    const savedOutlines = JSON.parse(localStorage.getItem("courseOutlines") || "[]")
    const foundOutline = savedOutlines.find((o: any) => o.id === id)

    if (foundOutline) {
      setOutline(foundOutline)
    } else {
      // Outline not found, redirect to outlines page
      router.push("/dashboard/outline")
    }
  }, [id, router])

  const handleEditClick = () => {
    router.push(`/dashboard/outline/${id}/edit`)
  }

  const handleCreateCourse = async () => {
    if (!outline) {
      alert("Outline data not found.")
      return
    }
    setIsGenerating(true)
    setGenerationProgress({module: 0, lesson: 0, totalModules: outline.modulesList.length, totalLessons: outline.modulesList.reduce((acc: number, m: any) => acc + (m.lessons?.length || 0), 0)})
    try {
      // Struktur awal course
      const courseId = uuidv4()
      const course = {
        courseId,
        outlineId: outline.id,
        title: outline.title,
        description: outline.description,
        modules: [] as any[],
        createdAt: new Date().toISOString()
      }
      let lessonCount = 0
      for (let m = 0; m < outline.modulesList.length; m++) {
        const module = outline.modulesList[m]
        const newModule = {
          id: module.id,
          title: module.title,
          lessons: [] as any[]
        }
        for (let l = 0; l < (module.lessons?.length || 0); l++) {
          const lesson = module.lessons[l]
          setGenerationProgress(p => ({...p, module: m+1, lesson: lessonCount+1}))
          // Generate konten lesson
          const lessonContent = await generateLessonContent({outlineData: outline, module, lesson})
          newModule.lessons.push({
            ...lessonContent
          })
          lessonCount++
          // Jeda 3 detik
          await delay(3000)
        }
        course.modules.push(newModule)
      }
      // Simpan ke localStorage
      const savedCourses = JSON.parse(localStorage.getItem("generatedCourses") || "[]")
      savedCourses.push(course)
      localStorage.setItem("generatedCourses", JSON.stringify(savedCourses))
      // Setelah selesai, redirect ke halaman daftar course
      router.push(`/dashboard/course`)
    } catch (error) {
      console.error("Failed to create course:", error)
      alert("Failed to create course. Please try again.")
    } finally {
      setIsGenerating(false)
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
      link.download = `${outline.title.replace(/\s+/g, "_")}_outline.json`
      link.click()
    }
  }

  const handleRegenerateOutline = async (inputData?: any) => {
    const formData = inputData || outline?.originalFormData
    if (!formData) {
      alert("Original form data not found for regeneration.")
      return
    }
    setIsRegenerating(true)
    try {
      const newOutlineData = await generateOutlineContent(formData)
      // Update the outline in localStorage
      const savedOutlines = JSON.parse(localStorage.getItem("courseOutlines") || "[]")
      const updatedOutlines = savedOutlines.map((o: any) =>
        o.id === outline.id ? { ...newOutlineData, originalFormData: formData } : o
      )
      localStorage.setItem("courseOutlines", JSON.stringify(updatedOutlines))
      // Update local state
      setOutline({ ...newOutlineData, originalFormData: formData })
      setRegenerateSuccess(true)
      setShowRegenerateForm(false)
      setTimeout(() => {
        setRegenerateSuccess(false)
        setIsRegenerating(false)
      }, 2000)
    } catch (error) {
      alert("Failed to regenerate outline.")
      setIsRegenerating(false)
    }
  }

  const generateOutlineContent = async (formData: any) => {
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" })

      const prompt = `Create a detailed course outline based on the following information:
Title: ${formData.title}
Topic: ${formData.topic}
${formData.degree ? `Degree/Field: ${formData.degree}` : ""}
${formData.difficulty ? `Difficulty Level: ${formData.difficulty}` : ""}
${formData.duration ? `Estimated Duration: ${formData.duration}` : ""}
${formData.language ? `Language: ${formData.language}` : ""}
${formData.video === 'yes' ? "Include video content suggestions." : ""}
${formData.chapters ? `Target Number of Chapters/Modules: ${formData.chapters}` : ""}
${formData.goals ? `Specific Learning Goals:\n${formData.goals}` : ""}

The output should be in a structured JSON format, suitable for a learning platform.
Include the following fields:
- id: A unique string identifier (use a timestamp or random string)
- title: The course title
- description: A brief course description
- topic: The main topic
- degree: The target degree/field (if provided)
- level: Difficulty level (Beginner, Intermediate, Advanced)
- duration: Estimated duration
- language: Course language
- includeVideo: boolean based on input
- status: Initial status (e.g., "Draft")
- modules: Total number of modules
- lessons: Total number of lessons
- estimatedHours: Estimated total study hours
- createdAt: Timestamp of creation
- modulesList: An array of module objects. Each module should have:
    - id: Module number (e.g., 1, 2, ...)
    - title: Module title
    - lessons: An array of lesson objects. Each lesson should have:
        - id: Lesson identifier (e.g., "1.1", "1.2", ...)
        - title: Lesson title
        - duration: Estimated lesson duration (e.g., "15 min", "30 min")
- learningGoals: An array of learning goal strings.
- overview: A general overview of the course.

Ensure the JSON is valid and contains only the described structure. Do not include any introductory or concluding text outside the JSON object.`

      const result = await model.generateContent(prompt)
      const response = result.response
      const text = response.text()

      console.log("Raw API Response (Outline):", text)

      // Extract JSON from the response, handling various formats
      let jsonString = text.trim()
      
      // Try to extract JSON from markdown code block
      const jsonMatch = jsonString.match(/```(?:json)?\n([\s\S]*?)\n```/)
      if (jsonMatch && jsonMatch[1]) {
        jsonString = jsonMatch[1].trim()
        console.log("Extracted JSON from markdown block (Outline):", jsonString)
      } else {
        // If no markdown block found, try to find JSON object directly
        const jsonObjectMatch = jsonString.match(/\{[\s\S]*\}/)
        if (jsonObjectMatch) {
          jsonString = jsonObjectMatch[0]
          console.log("Extracted JSON object (Outline):", jsonString)
        } else {
          console.warn("Could not find valid JSON in response (Outline):", text)
          throw new Error("Invalid response format from API (Outline)")
        }
      }

      try {
        const generatedOutline = JSON.parse(jsonString)
        
        // Add missing fields
        if (!generatedOutline.id) {
          generatedOutline.id = Date.now().toString()
        }
        if (!generatedOutline.createdAt) {
          generatedOutline.createdAt = new Date().toISOString()
        }
        if (!generatedOutline.status) {
          generatedOutline.status = "Draft" // Default status
        }

        return generatedOutline
      } catch (error) {
        console.error("Error parsing JSON (Outline):", error)
        console.error("Raw JSON string (Outline):", jsonString)
        throw new Error("Failed to parse outline content")
      }
    } catch (error) {
      console.error("Error generating outline:", error)
      throw error
    }
  }

  const generateCourseContent = async (outlineData: any) => {
    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-001",
        generationConfig: { maxOutputTokens: 8192 },
      });

      const prompt = `Buatkan struktur course yang komprehensif berdasarkan outline berikut:

**INFORMASI COURSE:**
- Judul: ${outlineData.title}
- Deskripsi: ${outlineData.description}
- Topik: ${outlineData.topic}
- Level: ${outlineData.level}
- Durasi: ${outlineData.duration}
- Bahasa: ${outlineData.language}
- Tujuan Pembelajaran: ${outlineData.learningGoals?.join("; ")}

**STRUKTUR MODULE & LESSON:**
${outlineData.modulesList.map((module: any) => `- ${module.title}: ${module.lessons.map((lesson: any) => lesson.title).join(', ')}`).join('\n')}

**PETUNJUK GENERASI:**
Untuk setiap lesson, buatkan:
1. **Konten Artikel Lengkap** - Artikel komprehensif yang mencakup semua aspek topik
2. **Gunakan pengetahuan terkini** - Berdasarkan informasi terbaru
3. **Sertakan Sitasi** - Format [1], [2], [3] di setiap bagian yang menggunakan sumber
4. **Referensi Lengkap** - Di akhir setiap lesson dengan link sumber yang relevan
5. **Struktur yang Jelas** - Pendahuluan, konsep dasar, penjelasan detail, contoh praktis, aplikasi, best practices, pitfalls & solusi, ringkasan, referensi
6. **Format Markdown** - Gunakan heading, bullet points, dan formatting yang rapi
7. **Contoh & Ilustrasi** - Sertakan contoh nyata dan studi kasus
8. **Aplikasi Praktis** - Tunjukkan implementasi dan penggunaan

**FORMAT OUTPUT JSON:**
{
  "courseId": "unique-id",
  "title": "${outlineData.title}",
  "description": "${outlineData.description}",
  "modules": [
    {
      "id": "module-1",
      "title": "Module Title",
      "lessons": [
        {
          "id": "1.1",
          "title": "Lesson Title",
          "content": "Artikel lengkap dalam format markdown dengan sitasi [1], [2], [3] dan section Referensi di akhir..."
        }
      ]
    }
  ]
}

**INSTRUKSI KONTEN:**
Gunakan pengetahuan terkini tentang setiap lesson topic. Pastikan setiap fakta, statistik, atau informasi spesifik memiliki sumber yang dapat diverifikasi. Sertakan sitasi dan referensi lengkap di setiap lesson.`

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

      console.log("Cleaned JSON string:", jsonString)

      // Try to parse the cleaned JSON
      let generatedCourse
      try {
        generatedCourse = JSON.parse(jsonString)
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError)
        console.error("Problematic JSON string:", jsonString)
        
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
        
        console.log("Attempting to parse fixed JSON:", jsonString)
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
          title: module.title || "Untitled Module",
          lessons: Array.isArray(module.lessons)
            ? module.lessons.map((lesson: any) => ({
                id: lesson.id || `lesson-${uuidv4()}`,
                title: lesson.title || "Untitled Lesson",
                content: lesson.content || "",
              }))
            : [],
        }));
      }

      return generatedCourse;
    } catch (error) {
      console.error("Error generating course content:", error);
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
            <Link href="/dashboard/outline" className="flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Outlines
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground">{outline.title}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
              {outline.status}
            </Badge>
            <Badge variant="outline" className="border-border bg-muted/50 text-muted-foreground">{outline.level}</Badge>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{outline.duration}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1 border-border text-foreground hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/50"
            onClick={() => {
              setRegenerateForm({ ...(outline?.originalFormData || {}) })
              setShowRegenerateForm(true)
            }}
            disabled={isRegenerating}
          >
            {isRegenerating ? "Regenerating..." : "Regenerate Outline"}
          </Button>
          <Button variant="outline" size="sm" className="gap-1 border-border text-foreground hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/50" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share
          </Button>
          <Button variant="outline" size="sm" className="gap-1 border-border text-foreground hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/50" onClick={handleExport}>
            <Download className="h-4 w-4" />
            Export
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
                Creating Course...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Create Course
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Course Title and Description */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">{outline.title}</h1>
        <p className="text-muted-foreground mt-2">{outline.description}</p>
      </div>

      {/* Course Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border shadow-sm bg-card text-card-foreground">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{outline.modules}</div>
              <p className="text-sm text-muted-foreground">Modules</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm bg-card text-card-foreground">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{outline.lessons}</div>
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
              <div className="text-2xl font-bold text-foreground">{outline.estimatedHours}</div>
              <p className="text-sm text-muted-foreground">Est. Duration</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border shadow-sm bg-card text-card-foreground">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 text-primary">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{outline.learningGoals?.length || 0}</div>
              <p className="text-sm text-muted-foreground">Learning Goals</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Content Tabs */}
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 text-muted-foreground">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Overview</TabsTrigger>
          <TabsTrigger value="modules" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Modules & Lessons</TabsTrigger>
          <TabsTrigger value="goals" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Learning Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card className="border border-border shadow-sm bg-card">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Course Overview</h2>
              <p className="text-muted-foreground leading-relaxed">{outline.overview}</p>

              {outline.topic && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border">
                  <h3 className="font-medium text-foreground mb-2">Topic Focus</h3>
                  <p className="text-muted-foreground">{outline.topic}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <Card className="border border-border shadow-sm bg-card">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-foreground">Course Modules</h2>
              <p className="text-muted-foreground mb-6">Detailed breakdown of all modules and lessons</p>

              <div className="space-y-8">
                {outline.modulesList?.map((module: any) => (
                  <div key={module.id} className="space-y-4">
                    <div className="bg-muted/50 text-muted-foreground px-3 py-1 rounded-md border border-border inline-block text-sm font-medium">
                      Module {module.id}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{module.title}</h3>

                    <div className="space-y-3 pl-4 border-l-2 border-border">
                      {module.lessons?.map((lesson: any) => (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between py-3 px-4 bg-card text-card-foreground rounded-lg border border-border hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium text-foreground">{lesson.id}</div>
                            <div className="font-medium text-foreground">{lesson.title}</div>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{lesson.duration}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card className="border border-border shadow-sm bg-card">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-foreground">
                <Target className="h-5 w-5 text-primary" />
                Learning Goals
              </h2>

              <div className="space-y-4">
                {outline.learningGoals?.map((goal: string, index: number) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="mt-0.5 text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <p className="text-muted-foreground">{goal}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Regenerate Outline Modal */}
      {showRegenerateForm && regenerateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 font-sans">
          <div className="bg-white border rounded-2xl shadow-2xl p-0 w-full max-w-xl max-h-[95vh] overflow-y-auto relative animate-fadeIn">
            <button
              type="button"
              className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-700 transition-colors"
              onClick={() => setShowRegenerateForm(false)}
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <form
              onSubmit={e => {
                e.preventDefault()
                setShowRegenerateForm(false)
                handleRegenerateOutline(regenerateForm)
              }}
            >
              <div className="border-0 shadow-none">
                <div className="px-8 pt-8">
                  <h2 className="text-2xl font-bold mb-4 text-center tracking-tight">Edit Outline Input</h2>
                </div>
                <div className="px-8 pb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="title" className="flex items-center gap-2 font-semibold text-gray-700 text-base"><GraduationCap className="w-5 h-5 text-emerald-500" /> Title</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base"
                        value={regenerateForm.title || ""}
                        onChange={e => setRegenerateForm((f: any) => ({ ...f, title: e.target.value }))}
                        required
                        placeholder="e.g. Introduction to Web Development"
                      />
                    </div>
                    <div>
                      <label htmlFor="degree" className="flex items-center gap-2 font-semibold text-gray-700 text-base"><Layers className="w-5 h-5 text-emerald-500" /> Degree/Field</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base"
                        value={regenerateForm.degree || ""}
                        onChange={e => setRegenerateForm((f: any) => ({ ...f, degree: e.target.value }))}
                        placeholder="e.g. Computer Science"
                      />
                    </div>
                    <div>
                      <label htmlFor="difficulty" className="flex items-center gap-2 font-semibold text-gray-700 text-base"><BookOpen className="w-5 h-5 text-emerald-500" /> Difficulty Level</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base"
                        value={regenerateForm.difficulty || ""}
                        onChange={e => setRegenerateForm((f: any) => ({ ...f, difficulty: e.target.value }))}
                        placeholder="e.g. Beginner"
                      />
                    </div>
                    <div>
                      <label htmlFor="duration" className="flex items-center gap-2 font-semibold text-gray-700 text-base"><Clock className="w-5 h-5 text-emerald-500" /> Estimated Duration</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base"
                        value={regenerateForm.duration || ""}
                        onChange={e => setRegenerateForm((f: any) => ({ ...f, duration: e.target.value }))}
                        placeholder="e.g. 4 weeks"
                      />
                    </div>
                    <div>
                      <label htmlFor="language" className="flex items-center gap-2 font-semibold text-gray-700 text-base"><Globe className="w-5 h-5 text-emerald-500" /> Language</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base"
                        value={regenerateForm.language || ""}
                        onChange={e => setRegenerateForm((f: any) => ({ ...f, language: e.target.value }))}
                        placeholder="e.g. English"
                      />
                    </div>
                    <div>
                      <label htmlFor="chapters" className="flex items-center gap-2 font-semibold text-gray-700 text-base"><ListOrdered className="w-5 h-5 text-emerald-500" /> No. of Chapters</label>
                      <input
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base"
                        value={regenerateForm.chapters || ""}
                        onChange={e => setRegenerateForm((f: any) => ({ ...f, chapters: e.target.value }))}
                        placeholder="5"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label htmlFor="topic" className="flex items-center gap-2 font-semibold text-gray-700 text-base"><FileText className="w-5 h-5 text-emerald-500" /> Topic Description</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[100px] mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base resize-y"
                      value={regenerateForm.topic || ""}
                      onChange={e => setRegenerateForm((f: any) => ({ ...f, topic: e.target.value }))}
                      required
                      placeholder="Describe the topic in detail"
                    />
                  </div>
                  <div className="mt-4">
                    <label htmlFor="goals" className="flex items-center gap-2 font-semibold text-gray-700 text-base"><BookOpen className="w-5 h-5 text-emerald-500" /> Learning Goals</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 min-h-[80px] mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-400 text-base"
                      value={regenerateForm.goals || ""}
                      onChange={e => setRegenerateForm((f: any) => ({ ...f, goals: e.target.value }))}
                      placeholder="Describe what you want to achieve and any specific topics you want to cover... (one goal per line)"
                    />
                  </div>
                  <div className="flex gap-2 mt-6 justify-end">
                    <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors">Regenerate</button>
                    <button type="button" className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition-colors" onClick={() => setShowRegenerateForm(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-50 flex flex-col items-center justify-center">
          <div className="bg-card p-8 rounded-lg shadow-lg flex flex-col items-center max-w-md">
            <div className="text-lg font-bold mb-2 text-foreground">Sedang generate lesson {generationProgress.lesson} dari {generationProgress.totalLessons}...</div>
            <div className="w-64 mb-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="bg-primary h-2 rounded-full" style={{width: `${Math.round((generationProgress.lesson/generationProgress.totalLessons)*100)}%`}}></div>
              </div>
            </div>
            <div className="text-muted-foreground text-sm text-center mb-4">
              Mohon tunggu, proses ini bisa memakan waktu beberapa menit.
            </div>
            
            {/* Peringatan AI Hallucination */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 w-full">
              <div className="flex items-start gap-3">
                <div className="text-amber-600 mt-0.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-sm">
                  <div className="font-medium text-amber-800 mb-1">Peringatan AI</div>
                  <div className="text-amber-700">
                    Course ini dibuat dengan AI menggunakan informasi web terkini untuk memastikan akurasi informasi. 
                    Meskipun konten telah diverifikasi dari sumber terpercaya, 
                    <strong> mohon periksa kembali konten yang dihasilkan untuk memastikan relevansi dengan kebutuhan Anda.</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRegenerating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex flex-col items-center justify-center">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-fadeIn min-w-[320px] max-w-xs">
            {regenerateSuccess ? (
              <>
                <div className="w-12 h-12 mb-4 flex items-center justify-center">
                  <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                </div>
                <div className="text-lg font-bold mb-2 text-emerald-600">Regenerate Outline Berhasil!</div>
                <div className="text-muted-foreground text-sm text-center">Outline berhasil diperbarui.</div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 mb-4 flex items-center justify-center">
                  <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                </div>
                <div className="text-lg font-bold mb-2 text-foreground">Regenerating Outline...</div>
                <div className="text-muted-foreground text-sm text-center">AI is creating your new course outline. Please wait a moment.</div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
