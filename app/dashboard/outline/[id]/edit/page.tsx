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
    estimatedhours: "",
    learningGoals: [] as string[],
  })
  const [modules, setModules] = useState<any[]>([])
  const supabase = createClientComponentClient();

  useEffect(() => {
    setIsMounted(true)
    const fetchOutline = async () => {
      const { data, error } = await supabase.from("outlines").select("*").eq("id", outlineId).single();
      if (error || !data) {
        router.push("/dashboard/outline");
      } else {
      setFormData({
          title: data.title || "",
          description: data.description || "",
          topic: data.topic || "",
          degree: data.degree || "",
          status: data.status || "Draft",
          level: data.level || "Intermediate",
          duration: data.duration || "",
          language: data.language || "english",
          includeVideo: data.includeVideo || false,
          overview: data.overview || "",
          estimatedhours: data.estimatedhours || "",
          learningGoals: typeof data.learning_goal === 'string' ? data.learning_goal.split(',').map((g: string) => g.trim()).filter(Boolean) : [],
        });
        setModules(Array.isArray(data.modules_detail) ? data.modules_detail : []);
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
    updatedModules[moduleIndex].lessons.push({
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
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
    updatedModules[moduleIndex].lessons = updatedModules[moduleIndex].lessons.map((lesson: any, idx: number) => ({
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
        title: "",
        lessons: [
          {
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMounted) return;

    // Calculate updated stats
    const totalLessons = Array.isArray(modules) ? modules.reduce((total: number, module: any) => total + (Array.isArray(module.lessons) ? module.lessons.length : 0), 0) : 0;
    const estimatedHours = `${totalLessons * 0.5}h`;

    // Prepare update payload
    const updatePayload = {
      title: formData.title,
      description: formData.description,
      topic: formData.topic,
      degree: formData.degree,
      status: formData.status,
      level: formData.level,
      duration: formData.duration,
      language: formData.language,
      overview: formData.overview,
      modules: Array.isArray(modules) ? modules.length : 0,
      lessons: totalLessons,
      estimatedhours: formData.estimatedhours || estimatedHours,
      modules_detail: modules,
      learning_goal: Array.isArray(formData.learningGoals) ? formData.learningGoals.join(', ') : '',
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase.from('outlines').update(updatePayload).eq('id', outlineId);
    if (error) {
      alert('Failed to update outline: ' + error.message);
      return;
    }

    alert('Outline updated successfully!');
    router.push(`/dashboard/outline/${outlineId}`);
  };

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
          <h1 className="text-2xl font-bold text-foreground mb-2">Edit Outline</h1>
        </div>
      </div>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Modules & Lessons</TabsTrigger>
          <TabsTrigger value="goals">Learning Goals</TabsTrigger>
          {/* <TabsTrigger value="breakdown">Course Modules</TabsTrigger> */}
        </TabsList>
        {/* Overview Tab */}
        <TabsContent value="overview">
          <form onSubmit={handleSubmit} className="space-y-8">
            <Card className="border border-border bg-card text-foreground shadow-none dark:bg-card dark:text-foreground dark:border-border">
              <CardHeader>
                <CardTitle>Edit Outline Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" value={formData.title} onChange={(e) => handleInputChange("title", e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="degree">Degree/Field</Label>
                    <Input id="degree" value={formData.degree} onChange={(e) => handleInputChange("degree", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="level">Difficulty Level</Label>
                    <Select value={formData.level} onValueChange={(v) => handleInputChange("level", v)}>
                      <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Estimated Duration</Label>
                    <Input id="duration" value={formData.duration} onChange={(e) => handleInputChange("duration", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="language">Language</Label>
                    <Input id="language" value={formData.language} onChange={(e) => handleInputChange("language", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="modules">No. of Chapters</Label>
                    <Input id="modules" value={Array.isArray(modules) ? modules.length : 0} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="lessons">No. of Lessons</Label>
                    <Input id="lessons" value={Array.isArray(modules) ? modules.reduce((total, m) => total + (Array.isArray(m.lessons) ? m.lessons.length : 0), 0) : 0} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="estimatedhours">Estimated Hours</Label>
                    <Input id="estimatedhours" value={formData.estimatedhours} onChange={(e) => handleInputChange("estimatedhours", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select value={formData.status} onValueChange={(v) => handleInputChange("status", v)}>
                      <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Published">Published</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="overview">Overview</Label>
                  <Textarea id="overview" value={formData.overview} onChange={(e) => handleInputChange("overview", e.target.value)} rows={3} />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => handleInputChange("description", e.target.value)} rows={3} />
                </div>
                <Button type="submit" className="mt-4"><Save className="mr-2 h-4 w-4" />Save Overview</Button>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
        {/* Modules & Lessons Tab */}
        <TabsContent value="modules">
          <Card className="border border-border bg-card text-foreground shadow-none">
            <CardHeader><CardTitle>Modules & Lessons</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <Button onClick={addModule} type="button" className="mb-4">+ Add Module</Button>
              {modules.map((module, mIdx) => (
                <div key={module.id || mIdx} className="border rounded p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Input value={module.title} onChange={e => handleModuleTitleChange(mIdx, e.target.value)} placeholder="Module Title" className="flex-1" />
                    <Button onClick={() => removeModule(mIdx)} type="button" variant="destructive" size="icon"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                  <ul className="space-y-2">
                    {module.lessons.map((lesson: any, lIdx: number) => (
                      <li key={lesson.id || lIdx} className="flex items-center gap-2">
                        <Input value={lesson.title} onChange={e => handleLessonChange(mIdx, lIdx, "title", e.target.value)} placeholder="Lesson Title" className="flex-1" />
                        <Input value={lesson.duration} onChange={e => handleLessonChange(mIdx, lIdx, "duration", e.target.value)} placeholder="Duration" className="w-24" />
                        <Button onClick={() => removeLesson(mIdx, lIdx)} type="button" variant="destructive" size="icon"><X className="h-4 w-4" /></Button>
                      </li>
                    ))}
                  </ul>
                  <Button onClick={() => addLesson(mIdx)} type="button" size="sm" className="mt-2">+ Add Lesson</Button>
                </div>
              ))}
              <Button onClick={handleSubmit} type="button" className="mt-4"><Save className="mr-2 h-4 w-4" />Save Modules & Lessons</Button>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Learning Goals Tab */}
        <TabsContent value="goals">
          <Card className="border border-border bg-card text-foreground shadow-none">
            <CardHeader><CardTitle>Learning Goals</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <Button onClick={addLearningGoal} type="button" className="mb-4">+ Add Learning Goal</Button>
              {formData.learningGoals.map((goal, idx) => (
                <div key={idx} className="flex items-center gap-2 mb-2">
                  <Input value={goal} onChange={e => handleLearningGoalChange(idx, e.target.value)} placeholder="Learning Goal" className="flex-1" />
                  <Button onClick={() => removeLearningGoal(idx)} type="button" variant="destructive" size="icon"><X className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button onClick={handleSubmit} type="button" className="mt-4"><Save className="mr-2 h-4 w-4" />Save Learning Goals</Button>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Removed Course Modules Breakdown Tab */}
        {/* <TabsContent value="breakdown"> ... </TabsContent> */}
      </Tabs>
    </div>
  )
}
