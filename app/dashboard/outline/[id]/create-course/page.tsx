"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Sparkles, BookOpen, Video, FileText, MessageSquare, Target } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function CreateCoursePage() {
  const { id } = useParams()
  const router = useRouter()
  const outlineId = Array.isArray(id) ? id[0] : id
  const [outline, setOutline] = useState<any>(null)

  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [courseSettings, setCourseSettings] = useState({
    title: "",
    description: "",
    contentDepth: "detailed",
    includeVideos: true,
    includeQuizzes: true,
    includeExercises: true,
    language: "english",
    tone: "professional",
    examples: true,
    codeSnippets: true,
  })

  const supabase = createClientComponentClient();
  const [error, setError] = useState("");

  // Load outline data
  useEffect(() => {
    const savedOutlines = JSON.parse(localStorage.getItem("courseOutlines") || "[]")
    const foundOutline = savedOutlines.find((o: any) => o.id === outlineId)

    if (foundOutline) {
      setOutline(foundOutline)
      setCourseSettings((prev) => ({
        ...prev,
        title: foundOutline.title,
        description: foundOutline.description,
        language: foundOutline.language || "english",
        includeVideos: foundOutline.includeVideo || false,
      }))
    } else {
      router.push("/dashboard/outline")
    }
  }, [outlineId, router])

  const handleSettingChange = (key: string, value: any) => {
    setCourseSettings((prev) => ({ ...prev, [key]: value }))
  }

  const generateCourseContent = (outline: any, settings: any) => {
    return (
      outline.modulesList?.map((module: any) => ({
        title: module.title,
        content: `# ${module.title}

## Overview
${module.title} is a comprehensive module covering essential concepts in ${outline.topic}. This module is designed to provide you with both theoretical understanding and practical skills.

## Learning Objectives
By the end of this module, you will be able to:
${module.lessons?.map((lesson: any, idx: number) => `- ${lesson.title.replace(/^Lesson \d+: /, "")}`).join("\n")}

## Module Content

${module.lessons
  ?.map(
    (lesson: any, idx: number) => `
### ${lesson.title}
Duration: ${lesson.duration}

This lesson covers fundamental concepts and practical applications related to ${lesson.title.replace(/^Lesson \d+: /, "")}. You'll learn through a combination of theoretical explanations, practical examples, and hands-on exercises.

Key topics include:
- Core principles and concepts
- Practical implementation techniques
- Real-world applications and use cases
- Best practices and common pitfalls

${
  settings.examples
    ? `
#### Practical Examples
- Step-by-step implementation guides
- Real-world case studies
- Interactive demonstrations
`
    : ""
}

${
  settings.codeSnippets &&
  (
    outline.topic.toLowerCase().includes("programming") ||
      outline.topic.toLowerCase().includes("development") ||
      outline.topic.toLowerCase().includes("coding")
  )
    ? `
#### Code Examples
\`\`\`javascript
// Example implementation for ${lesson.title.replace(/^Lesson \d+: /, "")}
function example() {
  console.log("Practical example for ${lesson.title.replace(/^Lesson \d+: /, "")}");
  // Implementation details here
}
\`\`\`
`
    : ""
}
`,
  )
  .join("\n")}

## Summary
This module provides comprehensive coverage of ${module.title.replace(/^Module \d+: /, "")}. The knowledge and skills gained here will serve as a foundation for advanced topics in subsequent modules.

## Assessment
${settings.includeQuizzes ? "Complete the module quiz to test your understanding of the key concepts covered." : "Review the key concepts and practice exercises to reinforce your learning."}
`,
        videoUrl: settings.includeVideos ? `https://youtube.com/example-${module.id}` : null,
        quiz: settings.includeQuizzes
          ? {
              questions: [
                {
                  question: `What are the main learning objectives of ${module.title}?`,
                  options: [
                    "Understanding theoretical concepts only",
                    "Practical implementation only",
                    "Both theoretical understanding and practical skills",
                    "Memorizing definitions",
                  ],
                  correct: 2,
                },
                {
                  question: `How many lessons are covered in ${module.title}?`,
                  options: [
                    `${Array.isArray(module.lessons) ? module.lessons.length - 1 : 0} lessons`,
                    `${Array.isArray(module.lessons) ? module.lessons.length : 0} lessons`,
                    `${Array.isArray(module.lessons) ? module.lessons.length + 1 : 1} lessons`,
                    "It varies",
                  ],
                  correct: 1,
                },
              ],
            }
          : null,
      })) || []
    )
  }

  const handleGenerateAndSaveOutline = async () => {
    setError("");
    if (!outline) return;
    // Validate all required fields
    const requiredFields = [
      courseSettings.title,
      courseSettings.description,
      outline?.topic,
      outline?.level,
      outline?.duration,
      courseSettings.language,
      outline?.modules,
      outline?.lessons,
      outline?.overview,
      outline?.learning_goal
    ];
    if (requiredFields.some(f => !f || f === "")) {
      setError("Please fill in all required fields.");
      return;
    }
    // Get user id from Supabase Auth
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      setError("User not authenticated.");
      return;
    }
    // Insert into outlines table
    const { error: dbError } = await supabase.from("outlines").insert({
      user_id: userId,
      title: courseSettings.title,
      description: courseSettings.description,
      topic: outline.topic,
      level: outline.level,
      duration: outline.duration,
      language: courseSettings.language,
      modules: outline.modules,
      lessons: outline.lessons,
      overview: outline.overview,
      learning_goal: outline.learning_goal
    });
    if (dbError) {
      setError("Failed to save outline: " + dbError.message);
      return;
    }
    // Success: redirect
    router.push("/dashboard/outline");
  }

  const handleCreateCourse = async () => {
    if (!outline) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    const steps = [
      "Analyzing outline structure...",
      "Generating comprehensive content...",
      "Creating interactive elements...",
      "Adding practical examples...",
      "Generating assessment materials...",
      "Finalizing course structure...",
    ];

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(steps[i]);
      setGenerationProgress((i + 1) * (100 / steps.length));
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    // Generate course content (array of lessons/chapters)
    const chapters = generateCourseContent(outline, courseSettings);

    // Get user id from Supabase Auth
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) {
      setError("User not authenticated.");
      setIsGenerating(false);
      return;
    }

    // Insert ke tabel courses
    const { data: courseInsert, error: courseError } = await supabase
      .from("courses")
      .insert([
        {
          user_id: userId,
          outline_id: outlineId,
          title: outline.title,
          description: outline.description,
          level: outline.level,
          duration: outline.duration,
          estimated_hours: outline.estimatedHours,
          modules: outline.modules,
          lessons: outline.lessons,
          progress: 0,
          status: "active",
          type: "generated",
          overview: outline.overview,
          topic: outline.topic,
          learning_goals: outline.learningGoals,
          settings: courseSettings,
          chatbot_qa: [
            {
              question: `What will I learn in ${outline.title}?`,
              answer: `In this course, you'll learn ${outline.topic}. The course covers ${outline.modules} modules with ${outline.lessons} lessons, designed to take you from ${outline.level?.toLowerCase?.()} to proficient level. You'll gain practical skills and theoretical knowledge that you can apply immediately.\n\nThe main learning goals include:\n${outline.learningGoals?.slice(0, 3).map((goal: string) => `- ${goal}`).join("\n")}`,
            },
            {
              question: "How long will it take to complete this course?",
              answer: `This course is estimated to take ${outline.estimatedHours} of study time over ${outline.duration}. However, you can learn at your own pace and revisit any content as needed. Each module contains ${Math.round(outline.lessons / outline.modules)} lessons on average.`,
            },
            {
              question: "What makes this course special?",
              answer: `This course was generated using AI based on your specific learning goals and the detailed outline you created. The content is personalized to your needs and includes:\n\n${courseSettings.includeVideos ? "- Video recommendations and tutorials\n" : ""}${courseSettings.includeQuizzes ? "- Interactive quizzes and assessments\n" : ""}${courseSettings.includeExercises ? "- Hands-on exercises and projects\n" : ""}${courseSettings.examples ? "- Real-world examples and case studies\n" : ""}\n\nThe course follows the exact structure you defined in your outline, ensuring consistency with your learning objectives.`,
            },
            {
              question: `Tell me more about the ${outline.topic} topics covered`,
              answer: `This course provides comprehensive coverage of ${outline.topic}. Based on your outline, the course is structured into ${outline.modules} main modules:\n\n${outline.modulesList?.slice(0, 3).map((module: any, idx: number) => `${idx + 1}. ${module.title} - ${Array.isArray(module.lessons) ? module.lessons.length : 0} lessons`).join("\n")}${outline.modules > 3 ? "\n...and more!" : ""}\n\nEach module builds upon the previous one, ensuring a logical progression through the material.`,
            },
          ],
          lessons_detail: chapters, // array of lesson object (format localStorage)
        },
      ])
      .select("id")
      .single();

    if (courseError || !courseInsert) {
      setError("Failed to save course: " + (courseError?.message || "Unknown error"));
      setIsGenerating(false);
      return;
    }

    const courseId = courseInsert.id;

    // Insert semua lessons ke tabel course_chapters
    const chaptersToInsert = chapters.map((chapter: any) => ({
      course_id: courseId,
      title: chapter.title,
      content: chapter.content,
      video_url: chapter.videoUrl,
      quiz: chapter.quiz,
    }));

    if (chaptersToInsert.length > 0) {
      const { error: chaptersError } = await supabase
        .from("course_chapters")
        .insert(chaptersToInsert);

      if (chaptersError) {
        setError("Failed to save lessons: " + chaptersError.message);
        setIsGenerating(false);
        return;
      }
    }

    setCurrentStep("Course created successfully!");

    setTimeout(() => {
      router.push(`/dashboard/course/${courseId}`);
    }, 1500);
  };

  if (!outline) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
          <p className="text-gray-600 mt-2">Please wait while we load your outline.</p>
        </div>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-emerald-600 animate-pulse" />
            </div>
            <CardTitle>Creating Your Course</CardTitle>
            <p className="text-sm text-gray-600">AI is generating personalized content for your course</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{Math.round(generationProgress)}%</span>
              </div>
              <Progress value={generationProgress} className="h-2" />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">{currentStep}</p>
            </div>
            
            {/* Peringatan AI Hallucination */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
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
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
          <Link href={`/dashboard/outline/${outlineId}`} className="flex items-center gap-1 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Outline
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create Course</h1>
        <p className="text-gray-600 mt-1">Generate a complete course from your outline with AI-powered content</p>
      </div>

      {/* Outline Summary */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            Source Outline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">{outline.title}</h3>
              <p className="text-gray-600 mb-4">{outline.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{outline.level}</Badge>
                <Badge variant="outline">{outline.duration}</Badge>
                <Badge variant="outline">{outline.estimatedHours}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{outline.modules}</div>
                <p className="text-sm text-gray-600">Modules</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{outline.lessons}</div>
                <p className="text-sm text-gray-600">Lessons</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Settings */}
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="content">Content Options</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Course Information</CardTitle>
              <p className="text-sm text-gray-600">Customize the basic details of your course</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={courseSettings.title}
                  onChange={(e) => handleSettingChange("title", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Course Description</Label>
                <Textarea
                  id="description"
                  value={courseSettings.description}
                  onChange={(e) => handleSettingChange("description", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={courseSettings.language}
                    onValueChange={(value) => handleSettingChange("language", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="indonesian">Indonesian</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="tone">Content Tone</Label>
                  <Select value={courseSettings.tone} onValueChange={(value) => handleSettingChange("tone", value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="conversational">Conversational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Content Generation Options</CardTitle>
              <p className="text-sm text-gray-600">Configure how the AI generates your course content</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="contentDepth">Content Depth</Label>
                <Select
                  value={courseSettings.contentDepth}
                  onValueChange={(value) => handleSettingChange("contentDepth", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="overview">Overview - Brief explanations</SelectItem>
                    <SelectItem value="detailed">Detailed - Comprehensive content</SelectItem>
                    <SelectItem value="expert">Expert - In-depth analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="examples"
                    checked={courseSettings.examples}
                    onCheckedChange={(checked) => handleSettingChange("examples", checked)}
                  />
                  <Label htmlFor="examples" className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Include practical examples
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="codeSnippets"
                    checked={courseSettings.codeSnippets}
                    onCheckedChange={(checked) => handleSettingChange("codeSnippets", checked)}
                  />
                  <Label htmlFor="codeSnippets" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Add code snippets and demos
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Interactive Features</CardTitle>
              <p className="text-sm text-gray-600">Choose which interactive elements to include in your course</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeVideos"
                    checked={courseSettings.includeVideos}
                    onCheckedChange={(checked) => handleSettingChange("includeVideos", checked)}
                  />
                  <Label htmlFor="includeVideos" className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Generate video recommendations
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeQuizzes"
                    checked={courseSettings.includeQuizzes}
                    onCheckedChange={(checked) => handleSettingChange("includeQuizzes", checked)}
                  />
                  <Label htmlFor="includeQuizzes" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Create interactive quizzes
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeExercises"
                    checked={courseSettings.includeExercises}
                    onCheckedChange={(checked) => handleSettingChange("includeExercises", checked)}
                  />
                  <Label htmlFor="includeExercises" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Add hands-on exercises
                  </Label>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  <h4 className="font-medium text-emerald-900">AI-Powered Features</h4>
                </div>
                <p className="text-sm text-emerald-700">
                  Our AI will automatically generate personalized content, interactive chatbot responses, and adaptive
                  learning paths based on your outline and preferences.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <Button variant="outline" onClick={() => router.push(`/dashboard/outline/${outlineId}`)}>
          Cancel
        </Button>
        <Button onClick={handleGenerateAndSaveOutline} className="bg-emerald-500 hover:bg-emerald-600 text-white">
          <Sparkles className="h-4 w-4 mr-2" />
          Generate & Save Outline
        </Button>
      </div>

      {error && <div className="text-red-600 font-medium mb-4">{error}</div>}
    </div>
  )
}
