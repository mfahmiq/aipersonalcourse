"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import Cookies from "js-cookie"

export default function EditLessonPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const currentLessonId = params.lessonId as string
  const userId = Cookies.get("user_id")

  const [lesson, setLesson] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    videoUrl: "",
    content: ""
  })

  useEffect(() => {
    const fetchLesson = async () => {
      const { data, error } = await supabase
        .from("lessons")
        .select("id, title, youtube_url, content")
        .eq("id", currentLessonId)
        .single();
      if (data) {
        setLesson(data)
        setFormData({
          title: data.title || "",
          videoUrl: data.youtube_url || "",
          content: data.content || ""
        })
      } else {
        router.push(`/dashboard/course/${courseId}/learn`)
      }
      setLoading(false)
    }
    fetchLesson()
  }, [courseId, currentLessonId, router])

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from("lessons")
        .update({
          title: formData.title,
          youtube_url: formData.videoUrl,
          content: formData.content
        })
        .eq("id", currentLessonId)
      if (error) throw error
      router.push(`/dashboard/course/${courseId}/learn/${currentLessonId}`)
      return
    } catch (error) {
      console.error("Error saving lesson:", error)
      alert("Failed to save lesson. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!lesson) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">Lesson not found</h2>
        <Button asChild>
          <Link href={`/dashboard/course/${courseId}/learn`}>Back to Lessons</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/dashboard/course/${courseId}/learn/${currentLessonId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lesson
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Lesson</h1>
          <p className="text-muted-foreground">Update lesson information</p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Lesson Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Lesson Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter lesson title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="videoUrl">YouTube Video Link</Label>
            <Input
              id="videoUrl"
              value={formData.videoUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
              placeholder="Enter YouTube video URL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Lesson Content</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Enter lesson content"
              rows={8}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/course/${courseId}/learn/${currentLessonId}`}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 