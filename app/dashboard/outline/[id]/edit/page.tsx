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

export default function EditOutlinePage() {
  const router = useRouter()
  const { id } = useParams()
  const outlineId = Array.isArray(id) ? id[0] : id
  const [isMounted, setIsMounted] = useState(false)

  // State for form data
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    topic: "",
    degree: "",
    status: "",
    level: "",
    duration: "",
    language: "",
    includeVideo: false,
    overview: "",
    learningGoals: [] as string[],
  })

  // State for modules and lessons
  const [modules, setModules] = useState<
    {
      id: number
      title: string
      lessons: { id: string; title: string; duration: string }[]
    }[]
  >([])

  // Load outline data
  useEffect(() => {
    setIsMounted(true)
    const savedOutlines = JSON.parse(localStorage.getItem("courseOutlines") || "[]")
    const outline = savedOutlines.find((o: any) => o.id === outlineId)

    if (outline) {
      setFormData({
        title: outline.title || "",
        description: outline.description || "",
        topic: outline.topic || "",
        degree: outline.degree || "",
        status: outline.status || "Draft",
        level: outline.level || "Intermediate",
        duration: outline.duration || "",
        language: outline.language || "english",
        includeVideo: outline.includeVideo || false,
        overview: outline.overview || "",
        learningGoals: Array.isArray(outline.learningGoals) ? outline.learningGoals : [],
      })
      setModules(Array.isArray(outline.modulesList) ? outline.modulesList : [])
    } else {
      // Outline not found, redirect
      router.push("/dashboard/outline")
    }
  }, [outlineId, router])

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
    updatedModules[moduleIndex].title = value
    setModules(updatedModules)
  }

  // Handle lesson changes
  const handleLessonChange = (moduleIndex: number, lessonIndex: number, field: string, value: string) => {
    const updatedModules = [...modules]
    updatedModules[moduleIndex].lessons[lessonIndex][field as "title" | "duration"] = value
    setModules(updatedModules)
  }

  // Add new lesson to a module
  const addLesson = (moduleIndex: number) => {
    const updatedModules = [...modules]
    const moduleId = updatedModules[moduleIndex].id
    const newLessonId = `${moduleId}.${Array.isArray(updatedModules[moduleIndex].lessons) ? updatedModules[moduleIndex].lessons.length + 1 : 1}`
    updatedModules[moduleIndex].lessons.push({
      id: newLessonId,
      title: "",
      duration: "15 min",
    })
    setModules(updatedModules)
  }

  // Remove lesson from a module
  const removeLesson = (moduleIndex: number, lessonIndex: number) => {
    const updatedModules = [...modules]
    updatedModules[moduleIndex].lessons.splice(lessonIndex, 1)
    // Update lesson IDs
    updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.map((lesson, idx) => ({
      ...lesson,
      id: `${updatedModules[moduleIndex].id}.${idx + 1}`,
    }))
    setModules(updatedModules)
  }

  // Add new module
  const addModule = () => {
    const newModuleId = Array.isArray(modules) && modules.length > 0 ? Math.max(...modules.map((m) => m.id)) + 1 : 1
    setModules([
      ...modules,
      {
        id: newModuleId,
        title: "",
        lessons: [
          {
            id: `${newModuleId}.1`,
            title: "",
            duration: "15 min",
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isMounted) return

    const savedOutlines = JSON.parse(localStorage.getItem("courseOutlines") || "[]")
    const existingOutline = savedOutlines.find((o: any) => o.id === outlineId)

    // Calculate updated stats
    const totalLessons = Array.isArray(modules) ? modules.reduce((total, module) => total + (Array.isArray(module.lessons) ? module.lessons.length : 0), 0) : 0
    const estimatedHours = `${totalLessons * 0.5}h`

    const updatedOutline = {
      id: outlineId,
      ...formData,
      modules: Array.isArray(modules) ? modules.length : 0,
      lessons: totalLessons,
      estimatedHours,
      modulesList: modules,
      updatedAt: new Date().toISOString(),
      originalFormData: existingOutline?.originalFormData,
    }

    // Update in localStorage
    const updatedOutlines = savedOutlines.map((outline: any) => (outline.id === outlineId ? updatedOutline : outline))
    localStorage.setItem("courseOutlines", JSON.stringify(updatedOutlines))

    // Show success message
    alert("Outline updated successfully!")

    // Navigate back to the outline view
    router.push(`/dashboard/outline/${outlineId}`)
  }

  if (!isMounted) return null

  return (
    <div className="space-y-8 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Link href={`/dashboard/outline/${outlineId}`} className="flex items-center gap-1 hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Back to Outline
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Edit Outline Input</h1>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="border border-border bg-card text-foreground shadow-none dark:bg-card dark:text-foreground dark:border-border">
          <CardHeader>
            <CardTitle>Edit Outline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="bg-background text-foreground border-border dark:bg-background dark:text-foreground dark:border-border"
                  required
                />
              </div>
              <div>
                <Label htmlFor="degree">Degree/Field</Label>
                <Input
                  id="degree"
                  value={formData.degree}
                  onChange={(e) => handleInputChange("degree", e.target.value)}
                  className="bg-background text-foreground border-border dark:bg-background dark:text-foreground dark:border-border"
                />
              </div>
              <div>
                <Label htmlFor="level">Difficulty Level</Label>
                <Select value={formData.level} onValueChange={(v) => handleInputChange("level", v)}>
                  <SelectTrigger className="bg-background text-foreground border-border dark:bg-background dark:text-foreground dark:border-border">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent className="bg-card text-foreground border-border dark:bg-card dark:text-foreground dark:border-border">
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="duration">Estimated Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  className="bg-background text-foreground border-border dark:bg-background dark:text-foreground dark:border-border"
                />
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <Input
                  id="language"
                  value={formData.language}
                  onChange={(e) => handleInputChange("language", e.target.value)}
                  className="bg-background text-foreground border-border dark:bg-background dark:text-foreground dark:border-border"
                />
              </div>
              <div>
                <Label htmlFor="modules">No. of Chapters</Label>
                <Input
                  id="modules"
                  value={Array.isArray(modules) ? modules.length : 0}
                  readOnly
                  className="bg-background text-foreground border-border dark:bg-background dark:text-foreground dark:border-border"
                />
              </div>
              <div>
                <Label htmlFor="lessons">No. of Lessons</Label>
                <Input
                  id="lessons"
                  value={Array.isArray(modules) ? modules.reduce((total, m) => total + (Array.isArray(m.lessons) ? m.lessons.length : 0), 0) : 0}
                  readOnly
                  className="bg-background text-foreground border-border dark:bg-background dark:text-foreground dark:border-border"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="overview">Overview</Label>
              <Textarea
                id="overview"
                value={formData.overview}
                onChange={(e) => handleInputChange("overview", e.target.value)}
                className="bg-background text-foreground border-border dark:bg-background dark:text-foreground dark:border-border"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="bg-background text-foreground border-border dark:bg-background dark:text-foreground dark:border-border"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
        {/* ...lanjutkan untuk bagian lain jika ada... */}
      </form>
    </div>
  )
}
