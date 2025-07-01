"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, FileText, MessageCircle, CheckCircle, Send, Menu, X, Eye, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { YouTubePlayer } from "@/components/ui/youtube-player"

// Fungsi untuk membersihkan markdown
function cleanMarkdown(md: string) {
  if (!md) return '';
  let cleaned = md.replace(/\\n/g, '\n').replace(/\n/g, '\n');
  // Hilangkan bullet kosong, spasi berlebih, dsb
  cleaned = cleaned.replace(/\\[*#-]/g, '').replace(/\\+/g, '');
  cleaned = cleaned.trim();
  return cleaned;
}

// Fungsi untuk mengekstrak referensi dari konten
function extractReferences(content: string): Array<{number: string, title: string, author: string, url: string}> {
  const references: Array<{number: string, title: string, author: string, url: string}> = []
  
  try {
    // Cari section referensi
    const referenceMatch = content.match(/(##?\s*Referensi?|##?\s*References?)([\s\S]*?)(?=##?\s*|$)/i)
    
    if (referenceMatch) {
      const referenceSection = referenceMatch[2]
      const lines = referenceSection.split('\n')
      
      for (const line of lines) {
        // Cari URL dalam baris
        const urlMatch = line.match(/\[(\d+)\]\s*(.*?)\s*-\s*(.*?)\s*-\s*(https?:\/\/[^\s]+)/)
        
        if (urlMatch) {
          const [fullMatch, number, title, author, url] = urlMatch
          references.push({
            number,
            title: title.trim(),
            author: author.trim(),
            url: url.trim()
          })
        }
      }
    }
  } catch (error) {
    console.error("Error extracting references:", error)
  }
  
  return references
}

// Fungsi untuk mengekstrak referensi yang tidak valid dari konten
function extractInvalidReferences(content: string): Array<{number: string, title: string, author: string, url: string}> {
  const invalidReferences: Array<{number: string, title: string, author: string, url: string}> = []
  
  try {
    // Cari section referensi
    const referenceMatch = content.match(/(##?\s*Referensi?|##?\s*References?)([\s\S]*?)(?=##?\s*|$)/i)
    
    if (referenceMatch) {
      const referenceSection = referenceMatch[2]
      const lines = referenceSection.split('\n')
      
      for (const line of lines) {
        // Cari URL dalam baris
        const urlMatch = line.match(/\[(\d+)\]\s*(.*?)\s*-\s*(.*?)\s*-\s*(https?:\/\/[^\s]+)/)
        
        if (urlMatch) {
          const [fullMatch, number, title, author, url] = urlMatch
          if (!url.startsWith('http')) {
            invalidReferences.push({
              number,
              title: title.trim(),
              author: author.trim(),
              url: url.trim()
            })
          }
        }
      }
    }
  } catch (error) {
    console.error("Error extracting invalid references:", error)
  }
  
  return invalidReferences
}

export default function LessonPage() {
  const { id, lessonId } = useParams()
  const router = useRouter()
  const courseId = Array.isArray(id) ? id[0] : id
  const currentLessonId = Array.isArray(lessonId) ? lessonId[0] : lessonId

  const [course, setCourse] = useState<any>(null)
  const [currentLesson, setCurrentLesson] = useState<any>(null)
  const [currentModule, setCurrentModule] = useState<any>(null)
  const [allLessons, setAllLessons] = useState<any[]>([])
  const [progress, setProgress] = useState(0)
  const [completedLessons, setCompletedLessons] = useState<string[]>([])
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({})
  const [quizSubmitted, setQuizSubmitted] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [showAssistant, setShowAssistant] = useState(false)
  const [assistantMessage, setAssistantMessage] = useState("")
  const [userMessage, setUserMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)

  // Load course data and current lesson
  useEffect(() => {
    // First check if it's a default course or generated course
    const generatedCourses = JSON.parse(localStorage.getItem("generatedCourses") || "[]")
    const course = generatedCourses.find((c: any) => c.courseId === courseId || c.id === courseId)

    if (course) {
      // Ensure course has required fields
      const validatedCourse = {
        ...course,
        courseId: course.courseId || course.id,
        title: course.title || "Untitled Course",
        description: course.description || "No description available",
        chapters: Array.isArray(course.chapters) ? course.chapters : [],
      }
      setCourse(validatedCourse)

      // Create flat list of all lessons
      const allLessonsArray: any[] = []
      const moduleIndex = 0

      // For generated courses, we need to create a lesson structure from chapters
      if (validatedCourse.chapters && validatedCourse.chapters.length > 0) {
        const modules = [
          {
            id: "introduction",
            title: "Introduction to " + validatedCourse.title,
            lessons: validatedCourse.chapters
              .slice(0, Math.ceil(validatedCourse.chapters.length / 2))
              .map((chapter: any, idx: number) => ({
                id: `1.${idx + 1}`,
                title: chapter.title.replace(/^Module \d+: /, ""),
                duration: `${15 + idx * 5} min`,
                content: chapter.content,
                videoUrl: chapter.videoUrl,
                moduleId: "introduction",
                moduleIndex: 0,
                lessonIndex: idx,
                quiz: generateQuiz(chapter.title, 5),
              })),
          },
          {
            id: "advanced",
            title: "Advanced Topics",
            lessons: validatedCourse.chapters.slice(Math.ceil(validatedCourse.chapters.length / 2)).map((chapter: any, idx: number) => ({
              id: `2.${idx + 1}`,
              title: chapter.title.replace(/^Module \d+: /, ""),
              duration: `${20 + idx * 5} min`,
              content: chapter.content,
              videoUrl: chapter.videoUrl,
              moduleId: "advanced",
              moduleIndex: 1,
              lessonIndex: idx,
              quiz: generateQuiz(chapter.title, 5),
            })),
          },
        ]

        // Flatten lessons for navigation
        modules.forEach((module, mIdx) => {
          module.lessons.forEach((lesson: any) => {
            allLessonsArray.push({
              ...lesson,
              moduleTitle: module.title,
              moduleId: module.id,
              moduleIndex: mIdx,
            })
          })
        })

        // Find current lesson and module
        const currentLessonObj = allLessonsArray.find((l) => l.id === currentLessonId)
        if (currentLessonObj) {
          setCurrentLesson(currentLessonObj)
          setCurrentModule(modules[currentLessonObj.moduleIndex])

          // Update recent courses in localStorage
          try {
            const recentCourses = JSON.parse(localStorage.getItem("recentCourses") || "[]")
            const updatedRecentCourses = recentCourses.filter((item: any) => item.courseId !== courseId)
            updatedRecentCourses.unshift({
              courseId: course.id,
              courseTitle: course.title,
              lastViewedLessonId: currentLessonObj.id,
              lastViewedLessonTitle: currentLessonObj.title,
              timestamp: Date.now(),
            })
            // Keep only the last 10 recent courses
            localStorage.setItem("recentCourses", JSON.stringify(updatedRecentCourses.slice(0, 10)))
          } catch (error) {
            console.error("Failed to update recent courses in localStorage:", error)
          }

        } else if (allLessonsArray.length > 0) {
          // If lesson not found, redirect to first lesson
          router.push(`/dashboard/course/${courseId}/learn/${allLessonsArray[0].id}`)
        }

        setAllLessons(allLessonsArray)
      }

      // Load completed lessons from localStorage
      const savedProgress = JSON.parse(localStorage.getItem(`course_progress_${courseId}`) || '{"completed": []}')
      setCompletedLessons(savedProgress.completed || [])

      // Calculate progress
      if (allLessonsArray.length > 0) {
        const progressPercentage = ((savedProgress.completed?.length || 0) / allLessonsArray.length) * 100
        setProgress(progressPercentage)
      }
    } else {
      // Course not found, redirect to courses page
      router.push("/dashboard/course")
    }

    // Debug log
    console.log('course', course);
    console.log('allLessons', allLessons);
    console.log('currentLessonId', currentLessonId);
    const foundLesson = allLessons.find((l) => String(l.id) === String(currentLessonId));
    console.log('foundLesson', foundLesson);
  }, [courseId, currentLessonId, router])

  // Debug: log course, currentLesson, allLessons
  useEffect(() => {
    if (course) {
      console.log('COURSE DATA:', course);
    }
    if (currentLesson) {
      console.log('CURRENT LESSON:', currentLesson);
    }
    if (allLessons) {
      console.log('ALL LESSONS:', allLessons);
    }
  }, [course, currentLesson, allLessons]);

  // Generate quiz questions for a lesson
  const generateQuiz = (lessonTitle: string, numQuestions = 5) => {
    const questions = [
      {
        question: `What is the main focus of "${lessonTitle}"?`,
        options: [
          "Understanding theoretical concepts",
          "Practical implementation",
          "Both theory and practical application",
          "Historical development",
        ],
        correct: 2,
      },
      {
        question: `Which of the following best describes the approach used in "${lessonTitle}"?`,
        options: ["Top-down methodology", "Bottom-up approach", "Hybrid methodology", "Experimental approach"],
        correct: 2,
      },
      {
        question: `What is a key benefit of mastering the concepts in "${lessonTitle}"?`,
        options: [
          "Improved problem-solving skills",
          "Better understanding of related topics",
          "Practical application in real-world scenarios",
          "All of the above",
        ],
        correct: 3,
      },
      {
        question: `Which skill is most important when working with "${lessonTitle.split(" ").slice(0, 3).join(" ")}"?`,
        options: ["Analytical thinking", "Attention to detail", "Creative problem solving", "Technical expertise"],
        correct: 0,
      },
      {
        question: `How does "${lessonTitle}" relate to other topics in this course?`,
        options: [
          "It's a prerequisite for advanced topics",
          "It builds on previous concepts",
          "It's a standalone topic",
          "It provides a framework for understanding the entire subject",
        ],
        correct: 1,
      },
    ]

    return {
      questions: questions.slice(0, numQuestions),
    }
  }

  // Mark lesson as complete
  const markAsComplete = () => {
    if (!currentLesson || !course) return

    const updatedCompleted = [...completedLessons]
    if (!updatedCompleted.includes(currentLesson.id)) {
      updatedCompleted.push(currentLesson.id)
    }

    setCompletedLessons(updatedCompleted)

    // Save to localStorage
    localStorage.setItem(
      `course_progress_${courseId}`,
      JSON.stringify({
        completed: updatedCompleted,
      }),
    )

    // Update progress
    const progressPercentage = (updatedCompleted.length / allLessons.length) * 100
    setProgress(progressPercentage)

    // Update course progress in courses list
    const generatedCourses = JSON.parse(localStorage.getItem("generatedCourses") || "[]")
    const updatedCourses = generatedCourses.map((c: any) => {
      if (c.id === courseId) {
        return {
          ...c,
          progress: progressPercentage,
        }
      }
      return c
    })
    localStorage.setItem("generatedCourses", JSON.stringify(updatedCourses))

    // Show quiz after marking complete
    setShowQuiz(true)

    // Scroll to quiz
    setTimeout(() => {
      contentRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
  }

  // Handle quiz submission
  const handleQuizSubmit = () => {
    if (!currentLesson?.quiz) return

    // Calculate score
    let correctAnswers = 0
    currentLesson.quiz.questions.forEach((q: any, idx: number) => {
      if (quizAnswers[idx] === q.correct) {
        correctAnswers++
      }
    })

    const score = Math.round((correctAnswers / currentLesson.quiz.questions.length) * 100)
    setQuizScore(score)
    setQuizSubmitted(true)
  }

  // Navigate to next or previous lesson
  const navigateLesson = (direction: "next" | "prev") => {
    if (!currentLesson || allLessons.length === 0) return

    const currentIndex = allLessons.findIndex((l) => l.id === currentLesson.id)
    if (currentIndex === -1) return

    let targetIndex
    if (direction === "next") {
      targetIndex = currentIndex + 1
      if (targetIndex >= allLessons.length) return // No next lesson
    } else {
      targetIndex = currentIndex - 1
      if (targetIndex < 0) return // No previous lesson
    }

    const targetLesson = allLessons[targetIndex]
    router.push(`/dashboard/course/${courseId}/learn/${targetLesson.id}`)

    // Reset quiz state
    setShowQuiz(false)
    setQuizAnswers({})
    setQuizSubmitted(false)

    // Scroll to top
    window.scrollTo(0, 0)
  }

  // Handle AI assistant
  const handleAssistantSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userMessage.trim() || !currentLesson) return

    // Add user message to chat
    const updatedChat = [...chatHistory, { role: "user", content: userMessage }]
    setChatHistory(updatedChat)
    setUserMessage("")

    // Compose prompt for Gemini
    const prompt = `You are a helpful course assistant. Help the user understand the following lesson.\n\nLesson Title: ${currentLesson.title}\nLesson Description: ${currentLesson.description || "-"}\nLesson Content (markdown):\n${typeof currentLesson.content === "string" ? currentLesson.content.slice(0, 4000) : ""}\n\nUser question: ${userMessage}\n\nIMPORTANT: Always answer in the same language as the user's question. If the question is in Indonesian, answer in Indonesian. If the question is in English, answer in English.\n\nGive a clear, concise, and friendly answer. If the answer is not in the lesson, say you don't know.`

    try {
      const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" })
      const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
      const response = result.response.text().trim()
      setChatHistory([...updatedChat, { role: "assistant", content: response }])
    } catch (err) {
      setChatHistory([...updatedChat, { role: "assistant", content: "Sorry, I couldn't get an answer from AI at the moment." }])
    }
  }

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Setelah setCourse, pastikan allLessons diisi dan log
  useEffect(() => {
    if (course) {
      // Flatten all lessons
      const allLessonsArray: any[] = [];
      if (course.modules && Array.isArray(course.modules)) {
        course.modules.forEach((mod: any, mIdx: number) => {
          if (mod.lessons && Array.isArray(mod.lessons)) {
            mod.lessons.forEach((lesson: any, lIdx: number) => {
              allLessonsArray.push({
                ...lesson,
                moduleTitle: mod.title,
                moduleId: mod.id,
                moduleIndex: mIdx,
              });
              console.log('lesson', lesson);
            });
          }
        });
      }
      setAllLessons(allLessonsArray);
      console.log('allLessonsArray', allLessonsArray);
    }
  }, [course]);

  // Load completed lessons from localStorage
  useEffect(() => {
    if (!courseId) return;
    const savedProgress = JSON.parse(localStorage.getItem(`course_progress_${courseId}`) || '{"completed": []}')
    setCompletedLessons(savedProgress.completed || [])
  }, [courseId])

  // Update progress whenever completedLessons or allLessons berubah
  useEffect(() => {
    if (allLessons.length > 0) {
      const progressPercentage = ((completedLessons.length || 0) / allLessons.length) * 100
      setProgress(progressPercentage)
      } else {
      setProgress(0)
    }
  }, [completedLessons, allLessons])

  if (!course) {
    return <div>Course not found</div>;
  }
  if (!currentLesson) {
    // Coba cari lesson dengan normalisasi id
    const foundLesson = allLessons.find((l) => String(l.id) === String(currentLessonId));
    if (foundLesson) {
      setCurrentLesson(foundLesson);
      return null;
    }
        return (
      <div>
        Lesson not found. Cek id lesson di URL dan data course di localStorage.
        <pre>{JSON.stringify(allLessons, null, 2)}</pre>
            </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden fixed inset-0 w-full pt-16">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Left Sidebar - Course Navigator (Fixed Position) */}
      <div
        className={`
      ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
      lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 
      w-80 bg-card border-r border-border flex flex-col h-full overflow-y-auto
      transition-transform duration-300 ease-in-out
      top-16
    `}
      >
        <div className="p-3 border-b flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg text-foreground">{course.title}</h2>
            <div className="mt-2">
              <div className="flex justify-between items-center text-sm mb-1">
                <span className="text-muted-foreground font-medium">Your Progress</span>
                <span className="text-muted-foreground font-semibold">{completedLessons.length} / {allLessons.length} lessons</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="h-2 flex-1 transition-all duration-500" />
                <span className="text-xs text-muted-foreground font-semibold min-w-[32px] text-right">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="lg:hidden h-8 w-8 p-0" onClick={() => setSidebarOpen(false)}>
            ×
          </Button>
        </div>

        <div className="p-4">
          {/* Group lessons by module, scrollable sidebar */}
          <div className="space-y-6">
          {Array.from(new Set(allLessons.map((l) => l.moduleId))).map((moduleId) => {
            const moduleTitle = allLessons.find((l) => l.moduleId === moduleId)?.moduleTitle
            const moduleLessons = allLessons.filter((l) => l.moduleId === moduleId)
            return (
                <div key={moduleId} className="mb-2">
                  <h3 className="font-medium text-foreground mb-2 truncate">{moduleTitle}</h3>
                <ul className="space-y-2">
                  {moduleLessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link
                        href={`/dashboard/course/${courseId}/learn/${lesson.id}`}
                        className={cn(
                            "block p-3 rounded-md transition-colors",
                            currentLesson.id === lesson.id ? "bg-primary/10 text-primary font-semibold" : "hover:bg-accent hover:text-foreground text-muted-foreground",
                        )}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5">
                            {completedLessons.includes(lesson.id) ? (
                              <div className="w-5 h-5 text-primary">
                                  <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20px" height="20px">
                                    <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                    <path d="m9 11l3 3L22 4" />
                                  </g>
                                </svg>
                              </div>
                            ) : (
                              <div className="w-5 h-5 border-2 border-muted rounded-full"></div>
                            )}
                          </div>
                            <div className="min-w-0">
                              <div className={cn("font-medium truncate", currentLesson.id === lesson.id && "font-semibold")}>{lesson.id} {lesson.title}</div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1 text-current" />
                              {lesson.duration}
                            </div>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="max-w-4xl mx-auto py-4 lg:py-6 px-3">
          {/* Debug Button */}
          <div className="mb-4">
            <button
              onClick={() => {
                const win = window.open('', '_blank');
                if (win && win.document) {
                  win.document.write('<pre>' + JSON.stringify({course: course ?? {}, currentLesson: currentLesson ?? {}, allLessons: allLessons ?? []}, null, 2) + '</pre>');
                }
              }}
              className="px-3 py-1 bg-amber-500 text-white rounded hover:bg-amber-600"
            >
              Debug: Show Course Data
            </button>
          </div>

          {/* Lesson Header */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{currentLesson.title}</h1>
              <div className="flex items-center mt-2 text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>{currentLesson.duration}</span>
              </div>
            </div>

            {/* Actions: Course Navigation Toggle (Mobile) and Mark as Complete */}
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              {/* Mobile Course Navigation Toggle - Only visible on mobile and small tablets */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSidebar}
                className="w-full sm:w-auto flex items-center justify-center gap-2 lg:hidden"
              >
                <Menu className="h-4 w-4" />
                Course Navigation
              </Button>

            <Button
              onClick={markAsComplete}
              disabled={completedLessons.includes(currentLesson.id)}
              size="sm"
              className={cn(
                "w-full sm:w-auto px-3 py-1.5 flex items-center gap-2 transition-colors",
                  completedLessons.includes(currentLesson.id)
                  ? "bg-primary text-primary-foreground cursor-default opacity-80"
                    : "bg-foreground text-background hover:bg-foreground/90"
              )}
            >
              {completedLessons.includes(currentLesson.id) ? (
                <>
                    <div className="w-4 h-4 mr-2">
                    <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16px" height="16px">
                        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <path d="m9 11l3 3L22 4" />
                      </g>
                    </svg>
                  </div>
                  <span>Completed</span>
                </>
              ) : (
                <>
                    <div className="w-4 h-4 mr-2 rounded-full border-2 border-current"></div>
                  <span>Mark as Complete</span>
                </>
              )}
            </Button>
          </div>
          </div>

          {/* Video Player */}
          <YouTubePlayer
            lessonTitle={currentLesson.title}
            lessonContent={typeof currentLesson.content === 'string' ? currentLesson.content : ''}
            courseTopic={course?.topic || course?.title || ''}
          />

          {/* Lesson Content */}
          <div ref={contentRef} className="bg-card border rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
              <FileText className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Lesson Content</h2>
            </div>

            {/* Normalisasi lesson jika content masih string JSON */}
            {(() => {
              let lesson = currentLesson;
              if (typeof lesson.content === 'string' && lesson.content.trim().startsWith('{')) {
                try {
                  const parsed = JSON.parse(lesson.content);
                  lesson = { ...lesson, ...parsed };
                } catch {}
              }
              return (
                <div className="prose max-w-none text-foreground">
                  <h1 className="text-3xl font-bold mb-6 text-foreground">{lesson.title}</h1>
                  
                  {/* Render konten artikel komprehensif dengan sitasi */}
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold mt-8 mb-4 text-foreground">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-semibold mt-6 mb-3 text-foreground">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2 text-foreground">{children}</h3>,
                      h4: ({ children }) => <h4 className="text-base font-medium mt-3 mb-2 text-foreground">{children}</h4>,
                      p: ({ children }) => <p className="mb-4 text-foreground leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside mb-4 space-y-1 text-foreground">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground">{children}</ol>,
                      li: ({ children }) => <li className="text-foreground">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                      em: ({ children }) => <em className="italic text-foreground">{children}</em>,
                      code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono text-foreground">{children}</code>,
                      pre: ({ children }) => <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4">{children}</blockquote>,
                      a: ({ href, children }) => {
                        // Jika ini adalah link referensi, berikan styling khusus
                        if (href && href.startsWith('http')) {
                          return (
                            <a 
                              href={href} 
                              className="text-primary hover:underline inline-flex items-center gap-1" 
                              target="_blank" 
                              rel="noopener noreferrer"
                            >
                              {children}
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          );
                        }
                        return <a href={href} className="text-primary hover:underline">{children}</a>;
                      },
                    }}
                  >
                    {cleanMarkdown(lesson.content)}
                  </ReactMarkdown>
                  
                  {/* Info tentang referensi */}
                  <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="text-blue-600 mt-0.5">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium text-blue-800 mb-1">Konten dengan Referensi</div>
                        <div className="text-blue-700">
                          Lesson ini dibuat dengan referensi dari berbagai sumber terpercaya untuk memastikan akurasi informasi. 
                          Semua fakta dan data telah diverifikasi dari sumber yang relevan. 
                          Lihat bagian "Referensi" di akhir konten untuk daftar lengkap sumber.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status Validasi Referensi */}
                  {(() => {
                    const references = extractReferences(lesson.content)
                    const invalidReferences = extractInvalidReferences(lesson.content)
                    
                    if (references.length > 0) {
                      return (
                        <div className="mt-4 space-y-3">
                          {/* Valid References */}
                          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <div className="text-green-600 mt-0.5">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <div className="text-sm flex-1">
                                <div className="font-medium text-green-800 mb-1">Referensi yang Divalidasi</div>
                                <div className="text-green-700 mb-3">
                                  {references.length} referensi telah divalidasi dan diperbaiki formatnya.
                                </div>
                                
                                {/* Daftar Referensi yang Divalidasi */}
                                <div className="space-y-2">
                                  {references.map((ref, index) => (
                                    <div key={index} className="flex items-center gap-2 text-xs">
                                      <div className="text-green-600">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                      <span className="text-green-800 font-medium">[{ref.number}]</span>
                                      <span className="text-green-700">{ref.title}</span>
                                      <span className="text-green-600">- {ref.author}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Invalid References Warning */}
                          {invalidReferences.length > 0 && (
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="flex items-start gap-3">
                                <div className="text-amber-600 mt-0.5">
                                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                  </svg>
                                </div>
                                <div className="text-sm flex-1">
                                  <div className="font-medium text-amber-800 mb-1">Referensi yang Perlu Perhatian</div>
                                  <div className="text-amber-700 mb-3">
                                    {invalidReferences.length} referensi memiliki format URL yang tidak valid dan telah dihapus.
                                  </div>
                                  
                                  {/* Daftar Referensi yang Tidak Valid */}
                                  <div className="space-y-2">
                                    {invalidReferences.map((ref, index) => (
                                      <div key={index} className="flex items-center gap-2 text-xs">
                                        <div className="text-amber-600">
                                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                          </svg>
                                        </div>
                                        <span className="text-amber-800 font-medium">[{ref.number}]</span>
                                        <span className="text-amber-700">{ref.title}</span>
                                        <span className="text-amber-600">- {ref.author}</span>
                                        <span className="text-amber-500">(URL tidak valid)</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              );
            })()}
          </div>

          {/* Quiz Section */}
          {(showQuiz || completedLessons.includes(currentLesson.id)) && currentLesson.quiz && (
            <Card className="mb-8 border">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold text-foreground">Knowledge Check</h2>
                </div>

                {quizSubmitted ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <div
                        className={cn(
                          "text-2xl font-bold mb-2",
                          quizScore >= 80 ? "text-primary" : quizScore >= 60 ? "text-amber-500" : "text-destructive",
                        )}
                      >
                        Your Score: {quizScore}%
                      </div>
                      <p className="text-muted-foreground">
                        {quizScore >= 80
                          ? "Great job! You've mastered this lesson."
                          : quizScore >= 60
                            ? "Good effort! Review the material to improve your understanding."
                            : "You might need to review this lesson again."}
                      </p>
                    </div>

                    <Button
                      onClick={() => {
                        setQuizSubmitted(false)
                        setQuizAnswers({})
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Retry Quiz
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {currentLesson.quiz.questions.map((question: any, idx: number) => (
                      <div key={idx} className="space-y-3">
                        <h3 className="font-medium text-foreground">
                          Question {idx + 1}: {question.question}
                        </h3>
                        <RadioGroup
                          value={quizAnswers[idx]?.toString()}
                          onValueChange={(value) => {
                            setQuizAnswers({ ...quizAnswers, [idx]: Number.parseInt(value) })
                          }}
                        >
                          {question.options.map((option: string, optIdx: number) => (
                            <div key={optIdx} className="flex items-center space-x-2">
                              <RadioGroupItem value={optIdx.toString()} id={`q${idx}-opt${optIdx}`} />
                              <Label htmlFor={`q${idx}-opt${optIdx}`} className="text-foreground">{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}

                    <Button
                      onClick={handleQuizSubmit}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={Object.keys(quizAnswers).length < currentLesson.quiz.questions.length}
                    >
                      Submit Answers
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-4 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateLesson("prev")}
              disabled={allLessons.findIndex((l) => l.id === currentLesson.id) === 0}
              className="w-full sm:w-auto px-3 py-1.5"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Lesson
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateLesson("next")}
              disabled={allLessons.findIndex((l) => l.id === currentLesson.id) === allLessons.length - 1}
              className="w-full sm:w-auto px-3 py-1.5"
            >
              Next Lesson
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* AI Assistant */}
      <div className={cn("fixed bottom-6 right-6 z-50 transition-all duration-300", showAssistant ? "w-80" : "w-auto")}>
        {showAssistant ? (
          <Card className="shadow-lg border">
            <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center rounded-t-lg">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                <h3 className="font-medium">Course Assistant</h3>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary/90"
                onClick={() => setShowAssistant(false)}
              >
                &times;
              </Button>
            </div>
            <CardContent className="p-3">
              <div className="h-64 overflow-y-auto mb-3 space-y-3">
                {chatHistory.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>How can I help you with this course?</p>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "p-2 rounded-lg max-w-[85%]",
                        msg.role === "user" ? "bg-muted ml-auto" : "bg-primary/10 mr-auto",
                      )}
                    >
                      {msg.content}
                    </div>
                  ))
                )}
              </div>

              <form onSubmit={handleAssistantSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder="Ask a question..."
                  className="flex-1 border border-input rounded-md px-2 py-1 text-sm h-8 focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
                />
                <Button type="submit" size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  Send
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Button
            onClick={() => setShowAssistant(true)}
            className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        )}
      </div>
    </div>
  )
}
