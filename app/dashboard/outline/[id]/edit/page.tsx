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
import { supabase } from "@/lib/supabase"
import Cookies from "js-cookie"

export default function EditOutlinePage() {
  const router = useRouter()
  const params = useParams()
  const outlineId = params.id as string
  const userId = Cookies.get("user_id")

  const [outline, setOutline] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    topic: "",
    level: "",
    duration: "",
    language: "",
    modules: 0,
    lessons: 0,
    overview: "",
    learning_goal: ""
  })

  useEffect(() => {
    const fetchOutline = async () => {
      const { data, error } = await supabase
        .from("outlines")
        .select("*")
        .eq("id", outlineId)
        .single();
      if (data) {
        setOutline(data)
        setFormData({
          title: data.title || "",
          description: data.description || "",
          topic: data.topic || "",
          level: data.level || "",
          duration: data.duration || "",
          language: data.language || "",
          modules: data.modules || 0,
          lessons: data.lessons || 0,
          overview: data.overview || "",
          learning_goal: data.learning_goal || ""
        })
      } else {
        router.push("/dashboard/outline")
      }
      setLoading(false)
    }
    fetchOutline()
  }, [outlineId, router])

  const handleSave = async () => {
    if (!outline) return
    try {
      const { error } = await supabase
        .from("outlines")
        .update({
          title: formData.title,
          description: formData.description,
          topic: formData.topic,
          level: formData.level,
          duration: formData.duration,
          language: formData.language,
          modules: formData.modules,
          lessons: formData.lessons,
          overview: formData.overview,
          learning_goal: formData.learning_goal
        })
        .eq("id", outlineId)
      if (error) throw error
      router.push(`/dashboard/outline/${outlineId}`)
    } catch (error) {
      alert("Failed to save outline. Please try again.")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!outline) {
    return <div>Outline not found</div>
  }

  // Handle input changes
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!outline) return

    // Calculate updated stats
    const estimatedHours = `${formData.lessons * 0.5}h`

    const updatedOutline = {
      id: outlineId,
      ...formData,
      estimatedHours,
      updatedAt: new Date().toISOString(),
      originalFormData: outline?.originalFormData,
    }

    // Update in Supabase
    handleSave()
  }

  if (!outline) return null

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
                  value={formData.modules}
                  readOnly
                  className="bg-background text-foreground border-border dark:bg-background dark:text-foreground dark:border-border"
                />
              </div>
              <div>
                <Label htmlFor="lessons">No. of Lessons</Label>
                <Input
                  id="lessons"
                  value={formData.lessons}
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
