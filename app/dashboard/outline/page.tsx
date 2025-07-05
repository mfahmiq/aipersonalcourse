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
    goals: "",
  })
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

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
    const savedOutlines = JSON.parse(localStorage.getItem("courseOutlines") || "[]")
    const cleaned = cleanCorruptOutlines(savedOutlines)
    if (cleaned.length !== savedOutlines.length) {
      localStorage.setItem("courseOutlines", JSON.stringify(cleaned))
    }
    setOutlines(cleaned)
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
      alert("Please fill in at least the title and topic fields")
      return
    }

    setIsGenerating(true)

    try {
        const newOutline = await generateOutlineContent(formData)

        // Save original form data along with the generated outline
        const outlineWithFormData = {
          ...newOutline,
          originalFormData: formData, // Store the original form data
        };

        // Save to localStorage
        const existingOutlines = JSON.parse(localStorage.getItem("courseOutlines") || "[]")
        const updatedOutlines = [...existingOutlines, outlineWithFormData]
        localStorage.setItem("courseOutlines", JSON.stringify(updatedOutlines))

        // Update state
        setOutlines(updatedOutlines)

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
          goals: "",
        })

        // Navigate to the new outline
        router.push(`/dashboard/outline/${newOutline.id}`)

    } catch (error) {
        // Error handling is done within generateOutlineContent
    } finally {
        setIsGenerating(false)
    }
  }

  const handleDeleteOutline = (id: string) => {
    if (confirm("Are you sure you want to delete this outline?")) {
      const updatedOutlines = outlines.filter((outline) => outline.id !== id)
      setOutlines(updatedOutlines)
      localStorage.setItem("courseOutlines", JSON.stringify(updatedOutlines))
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
      case "beginner":
      case "Beginner":
        return "bg-primary/10 text-primary"
      case "intermediate":
      case "Intermediate":
        return "bg-primary/10 text-primary"
      case "advanced":
      case "Advanced":
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
            <CardTitle>Generating Course Outline</CardTitle>
            <p className="text-sm text-muted-foreground">AI is creating your personalized course outline</p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-4">This may take a few moments...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Course Outlines</h1>
        <p className="text-muted-foreground mt-1">Create and manage AI-generated course outlines for your learning journey.</p>
        <Button className="mt-4" onClick={() => setShowGenerateModal(true)}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Course Outline
        </Button>
      </div>

      {/* Generate Course Outline Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 font-sans">
          <div className="bg-white border rounded-2xl shadow-2xl p-0 w-full max-w-xl max-h-[95vh] overflow-y-auto relative animate-fadeIn">
            <button
              type="button"
              className="absolute top-3 right-3 text-2xl text-gray-400 hover:text-gray-700 transition-colors"
              onClick={() => setShowGenerateModal(false)}
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
            <Card className="border-0 shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Generate Course Outline
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Describe what you want to learn and our AI will create a comprehensive course outline for you.
          </p>
        </CardHeader>
              <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                    <Label htmlFor="title" className="flex items-center gap-2"><GraduationCap className="w-5 h-5 text-emerald-500" /> Title</Label>
                    <Input id="title" placeholder="e.g. Introduction to Web Development" value={formData.title} onChange={e => handleInputChange("title", e.target.value)} className="mt-1" />
              </div>
              <div>
                    <Label htmlFor="degree" className="flex items-center gap-2"><Layers className="w-5 h-5 text-emerald-500" /> Degree/Field</Label>
                    <Input id="degree" placeholder="e.g. Computer Science" value={formData.degree} onChange={e => handleInputChange("degree", e.target.value)} className="mt-1" />
            </div>
              <div>
                    <Label htmlFor="difficulty" className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-emerald-500" /> Difficulty Level</Label>
                    <Input id="difficulty" placeholder="e.g. Beginner" value={formData.difficulty} onChange={e => handleInputChange("difficulty", e.target.value)} className="mt-1" />
              </div>
              <div>
                    <Label htmlFor="duration" className="flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-500" /> Estimated Duration</Label>
                    <Input id="duration" placeholder="e.g. 4 weeks" value={formData.duration} onChange={e => handleInputChange("duration", e.target.value)} className="mt-1" />
            </div>
              <div>
                    <Label htmlFor="language" className="flex items-center gap-2"><Globe className="w-5 h-5 text-emerald-500" /> Language</Label>
                    <Input id="language" placeholder="e.g. English" value={formData.language} onChange={e => handleInputChange("language", e.target.value)} className="mt-1" />
              </div>
              <div>
                    <Label htmlFor="chapters" className="flex items-center gap-2"><ListOrdered className="w-5 h-5 text-emerald-500" /> No. of Chapters</Label>
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
                  <Label htmlFor="topic" className="flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-500" /> Topic Description</Label>
                  <Textarea
                    id="topic"
                    placeholder="Describe the topic in detail"
                    value={formData.topic}
                    onChange={e => handleInputChange("topic", e.target.value)}
                    className="mt-1 min-h-[100px] resize-y"
                    required
                  />
                </div>
                <div className="mt-4">
                  <Label htmlFor="goals" className="flex items-center gap-2"><BookOpen className="w-5 h-5 text-emerald-500" /> Learning Goals</Label>
              <Textarea
                id="goals"
                placeholder="Describe what you want to achieve and any specific topics you want to cover... (one goal per line)"
                value={formData.goals}
                onChange={(e) => handleInputChange("goals", e.target.value)}
                className="mt-1 min-h-[80px]"
              />
            </div>
          <Button
            onClick={handleGenerateOutline}
                  className="bg-foreground hover:bg-foreground/90 text-background mt-6"
            disabled={!formData.title || !formData.topic}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Outline
          </Button>
        </CardContent>
      </Card>
          </div>
        </div>
      )}

      {/* Your Outlines */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Your Outlines</h2>

        {Array.isArray(outlines) && outlines.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-lg bg-card p-8 shadow-sm">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No outlines created yet</h3>
            <p className="text-muted-foreground mb-6">
              Generate your first course outline to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outlines.map((outline) => (
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
                    <span>{Array.isArray(outline.modulesList) ? outline.modulesList.length : 0} Modules</span>
                    <span>•</span>
                    <span>{Array.isArray(outline.modulesList) ? outline.modulesList.reduce((acc: number, m: any) => acc + (Array.isArray(m.lessons) ? m.lessons.length : 0), 0) : 0} Lessons</span>
                    <span>•</span>
                    <span>{typeof outline.estimatedHours === "number" || typeof outline.estimatedHours === "string" ? outline.estimatedHours : "?"}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground text-sm line-clamp-2">{typeof outline.description === "string" ? outline.description : ""}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className={`border border-border ${getStatusColor(outline.status)}`}>
                      {typeof outline.status === "string" ? outline.status : "Unknown"}
                    </Badge>
                    <Badge variant="outline" className={`border border-border ${getLevelColor(outline.level)}`}>
                      {typeof outline.level === "string" ? outline.level : "Unknown"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="w-full border border-border text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/50" asChild>
                      <Link href={`/dashboard/outline/${outline.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" className="w-full border border-border text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/50" onClick={() => handleEditClick(outline.id)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

