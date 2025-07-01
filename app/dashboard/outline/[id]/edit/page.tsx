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
    const newLessonId = `${moduleId}.${updatedModules[moduleIndex].lessons.length + 1}`
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
    const newModuleId = modules.length > 0 ? Math.max(...modules.map((m) => m.id)) + 1 : 1
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

    const savedOutlines = JSON.parse(localStorage.getItem("courseOutlines") || "[]")
    const existingOutline = savedOutlines.find((o: any) => o.id === outlineId)

    // Calculate updated stats
    const totalLessons = modules.reduce((total, module) => total + module.lessons.length, 0)
    const estimatedHours = `${totalLessons * 0.5}h`

    const updatedOutline = {
      id: outlineId,
      ...formData,
      modules: modules.length,
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
          <h1 className="text-3xl font-bold text-foreground">Edit Outline</h1>
          <p className="text-muted-foreground mt-1">Modify your course outline details and content</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground" onClick={() => router.push(`/dashboard/outline/${outlineId}`)}>
            Cancel
          </Button>
          <Button className="bg-primary hover:bg-primary-foreground text-primary-foreground hover:text-primary" onClick={handleSubmit}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-muted/50 text-muted-foreground">
          <TabsTrigger value="basic" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Basic Information</TabsTrigger>
          <TabsTrigger value="modules" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Modules & Lessons</TabsTrigger>
          <TabsTrigger value="goals" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Learning Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card className="border border-border shadow-sm bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-foreground">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="mt-1 bg-input text-foreground border-border focus:border-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="mt-1 bg-input text-foreground border-border focus:border-primary"
                  />
                </div>

                <div>
                  <Label htmlFor="topic">Topic Focus</Label>
                  <Input
                    id="topic"
                    value={formData.topic}
                    onChange={(e) => handleInputChange("topic", e.target.value)}
                    className="mt-1 bg-input text-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="level">Level</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => handleInputChange("level", value)}
                    >
                      <SelectTrigger className="mt-1 bg-input text-foreground border-border focus:border-primary">
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-popover-foreground">
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
                      className="mt-1 bg-input text-foreground"
                      placeholder="e.g., 10 hours"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={formData.language}
                      onValueChange={(value) => handleInputChange("language", value)}
                    >
                      <SelectTrigger className="mt-1 bg-input text-foreground border-border focus:border-primary">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-popover-foreground">
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="indonesian">Indonesian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange("status", value)}
                    >
                      <SelectTrigger className="mt-1 bg-input text-foreground border-border focus:border-primary">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover text-popover-foreground">
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Published">Published</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="overview">Overview</Label>
                  <Textarea
                    id="overview"
                    value={formData.overview}
                    onChange={(e) => handleInputChange("overview", e.target.value)}
                    className="mt-1 bg-input text-foreground"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6">
          <Card className="border border-border shadow-sm bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-foreground">Modules & Lessons</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {modules.map((module, moduleIndex) => (
                <div key={module.id} className="border p-4 rounded-md space-y-4 border-border bg-background shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Module {module.id}</h3>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeModule(moduleIndex)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div>
                    <Label htmlFor={`module-title-${module.id}`}>Module Title</Label>
                    <Input
                      id={`module-title-${module.id}`}
                      value={module.title}
                      onChange={(e) => handleModuleTitleChange(moduleIndex, e.target.value)}
                      className="mt-1 bg-input text-foreground border-border focus:border-primary"
                      placeholder="Module title"
                    />
                  </div>

                  <div className="space-y-3 pl-4 border-l-2 border-border">
                    <h4 className="font-semibold text-foreground">Lessons</h4>
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.id} className="flex items-center gap-4 py-2 border-b border-border last:border-b-0">
                        <div className="flex-shrink-0 text-sm font-medium text-muted-foreground w-8">{lesson.id}</div>
                        <div className="flex-grow">
                          <Input
                            value={lesson.title}
                            onChange={(e) => handleLessonChange(moduleIndex, lessonIndex, "title", e.target.value)}
                            placeholder="Lesson title"
                            className="bg-input text-foreground border-border focus:border-primary"
                          />
                        </div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeLesson(moduleIndex, lessonIndex)}>
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="gap-1 border border-border text-foreground hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/50" onClick={() => addLesson(moduleIndex)}>
                      Add Lesson
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="gap-1 border border-border text-foreground hover:bg-accent/50 hover:text-accent-foreground hover:border-primary/50" onClick={addModule}>
                Add Module
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card className="border border-border shadow-sm bg-card text-card-foreground">
            <CardHeader>
              <CardTitle className="text-foreground">Learning Goals</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {formData.learningGoals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="flex-grow">
                      <Input
                        value={goal}
                        onChange={(e) => handleLearningGoalChange(index, e.target.value)}
                        placeholder={`Learning Goal ${index + 1}`}
                        className="bg-input text-foreground border-border focus:border-primary"
                      />
                    </div>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeLearningGoal(index)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button variant="outline" className="gap-1 border-border text-foreground hover:bg-accent hover:text-accent-foreground" onClick={addLearningGoal}>
                  Add Learning Goal
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
