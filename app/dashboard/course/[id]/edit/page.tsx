"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Save, Loader2 } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import Cookies from "js-cookie"

interface CourseData {
  courseId?: string
  id?: string
  title: string
  description: string
  level: string
  duration: string
  lessons: number
  modules: any[]
  createdAt: string
}

export default function EditCoursePage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const userId = Cookies.get("user_id")

  const [course, setCourse] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    level: string;
    duration: string;
  }>({
    title: "",
    description: "",
    level: "",
    duration: ""
  })

  useEffect(() => {
    const fetchCourse = async () => {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, description, level, duration")
        .eq("id", courseId)
        .single();
      if (error) console.error("Course fetch error:", error);
      if (data) {
        setCourse(data)
        setFormData({
          title: data.title || "",
          description: data.description || "",
          level: data.level || "Beginner",
          duration: data.duration || "8 weeks"
        })
      } else {
        // Course not found, redirect to course list
        router.push("/dashboard/course")
      }
      setLoading(false)
    }
    fetchCourse()
  }, [courseId, router])

  const handleSave = async () => {
    if (!course) return
    setSaving(true)
    try {
      // Update course in Supabase
      const { error } = await supabase
        .from("courses")
        .update({
          title: formData.title,
          description: formData.description,
          level: formData.level,
          duration: formData.duration
        })
        .eq("id", courseId)
      if (error) {
        console.error("Course update error:", error);
        throw error
      }
      // Redirect back to course list
      router.push("/dashboard/course")
    } catch (error) {
      console.error("Error saving course:", error)
      alert("Failed to save course. Please try again.")
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

  if (!course) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold mb-4">Course not found</h2>
        <Button asChild>
          <Link href="/dashboard/course">Back to Courses</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/course">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Edit Course</h1>
          <p className="text-muted-foreground">Update your course information</p>
        </div>
      </div>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Course Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Course Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter course title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter course description"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select value={formData.level} onValueChange={(value: string) => setFormData((prev) => ({ ...prev, level: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setFormData((prev) => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 8 weeks"
              />
            </div>
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
              <Link href="/dashboard/course">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Course Info */}
      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Total Lessons:</span>
              <span className="ml-2">{course.lessons}</span>
            </div>
            <div>
              <span className="font-medium text-muted-foreground">Created:</span>
              <span className="ml-2">{new Date(course.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 