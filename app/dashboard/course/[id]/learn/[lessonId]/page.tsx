"use client"

import React, { useState, useEffect, useRef } from "react"
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
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { YouTubePlayer } from "@/components/ui/youtube-player"
import rehypeRaw from "rehype-raw"
import { LessonSidebar } from "@/components/lesson/LessonSidebar"
import { LessonMainContent } from "@/components/lesson/LessonMainContent"
import { LessonAssistant } from "@/components/lesson/LessonAssistant"
import { LESSON_ASSISTANT_PROMPT } from "@/lib/utils/prompts"
import { generateLessonAssistant } from "@/lib/utils/gemini"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { supabase } from "@/lib/supabase"
import Cookies from "js-cookie"

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

interface CodeRendererProps {
  node?: any; // You can refine this type based on remark-parse AST node type
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

const CodeRenderer = ({ node, inline, className, children, ...props }: CodeRendererProps) => {
  const match = /language-(\w+)/.exec(className || "");
  return !inline && match ? (
    <SyntaxHighlighter
      style={coldarkDark as { [key: string]: React.CSSProperties }}
      language={match[1]}
      PreTag="div"
      {...props}
    >
      {String(children).replace(/\n$/, "")}
    </SyntaxHighlighter>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

export default function LessonPage() {
  const router = useRouter()
  const params = useParams()
  const courseId = params.id as string
  const currentLessonId = params.lessonId as string
  const supabase = createClientComponentClient()
  const userId = Cookies.get("user_id")

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

  useEffect(() => {
    const fetchCourseAndLessons = async () => {
      // Ambil data course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("*, lessons(*)")
        .eq("id", courseId)
        .single()
      if (courseError) console.error("Course fetch error:", courseError);
      if (!courseData) return router.push("/dashboard/course")
      setCourse(courseData)
      setAllLessons(courseData.lessons || [])

      // Ambil progress user
      const { data: progressData, error: progressError } = await supabase
        .from("user_progress")
        .select("completed, progress_percentage")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single()
      if (progressError) console.error("User progress fetch error:", progressError);
      setCompletedLessons(
        Array.isArray(progressData?.completed)
          ? progressData.completed
          : JSON.parse(progressData?.completed || '[]')
      )
      setProgress(progressData?.progress_percentage || 0)

      // Set current lesson
      const foundLesson = (courseData.lessons || []).find((l: any) => l.id === currentLessonId)
      if (foundLesson) {
        setCurrentLesson(foundLesson)
      } else if ((courseData.lessons || []).length > 0) {
        router.push(`/dashboard/course/${courseId}/learn/${courseData.lessons[0].id}`)
      }
    }
    fetchCourseAndLessons()
  }, [courseId, currentLessonId, router, supabase, userId])

  // Debug: log course, currentLesson, allLessons
  useEffect(() => {
    if (course) {
      console.log('COURSE DATA:', course)
    }
    if (currentLesson) {
      console.log('CURRENT LESSON:', currentLesson)
    }
    if (allLessons) {
      console.log('ALL LESSONS:', allLessons)
    }
  }, [course, currentLesson, allLessons])

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
  const markAsComplete = async () => {
    if (!currentLesson || !course) return

    // Update progress
    const progressPercentage = (completedLessons.length / allLessons.length) * 100
    setProgress(progressPercentage)

    // Simpan ke Supabase
    let completedString: string = "[]";
    if (Array.isArray(completedLessons)) {
      completedString = JSON.stringify(completedLessons);
    } else if (typeof completedLessons === "string") {
      completedString = completedLessons;
    }
    const upsertObj: any = {
      user_id: userId,
      course_id: courseId,
      lesson_id: currentLesson.id,
      // Ensure completed is always a string (JSON array)
      completed: completedString,
      progress_percentage: progressPercentage,
      last_accessed: new Date().toISOString(),
    }
    // Debug log to check type and value
    console.log("upsertObj.completed", upsertObj.completed, typeof upsertObj.completed, Array.isArray(upsertObj.completed))
    // TypeScript fix: completed must be a string, not string[]
    await supabase.from("user_progress").upsert([upsertObj], { onConflict: "user_id,course_id" })

    // Show quiz after marking complete
    setShowQuiz(true)

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

    try {
      const response = await generateLessonAssistant({ currentLesson, userMessage }, process.env.NEXT_PUBLIC_GEMINI_API_KEY!)
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
      const allLessonsArray: any[] = []
      if (course.modules && Array.isArray(course.modules)) {
        course.modules.forEach((mod: any, mIdx: number) => {
          if (mod.lessons && Array.isArray(mod.lessons)) {
            mod.lessons.forEach((lesson: any, lIdx: number) => {
              allLessonsArray.push({
                ...lesson,
                moduleTitle: mod.title,
                moduleId: mod.id,
                moduleIndex: mIdx,
                courseId: course.courseId,
              })
              console.log('lesson', lesson)
            })
          }
        })
      }
      setAllLessons(allLessonsArray)
      console.log('allLessonsArray', allLessonsArray)
    }
  }, [course])

  // Load completed lessons from Supabase
  useEffect(() => {
    if (!courseId) return
    const fetchCompletedLessons = async () => {
      const { data: progressData } = await supabase
        .from("user_progress")
        .select("completed")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single()
      let completedArr: string[] = [];
      if (Array.isArray(progressData?.completed)) {
        completedArr = progressData.completed;
      } else if (typeof progressData?.completed === "string") {
        try {
          completedArr = JSON.parse(progressData.completed);
        } catch {
          completedArr = [];
        }
      }
      setCompletedLessons(completedArr)
    }
    fetchCompletedLessons()
  }, [courseId, supabase, userId])

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
    return <div>Course not found</div>
  }
  if (!currentLesson) {
    // Coba cari lesson dengan normalisasi id
    const foundLesson = allLessons.find((l) => String(l.id) === String(currentLessonId))
    if (foundLesson) {
      setCurrentLesson(foundLesson)
      return null
    }
    return (
      <div>
        Lesson not found. Cek id lesson di URL dan data course di Supabase.
        <pre>{JSON.stringify(allLessons, null, 2)}</pre>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden fixed inset-0 w-full pt-16">
      {/* Sidebar */}
      <LessonSidebar
        courseTitle={course?.title || ""}
        completedLessons={completedLessons}
        allLessons={allLessons}
        currentLessonId={currentLesson?.id || ""}
        progress={progress}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-background">
        <LessonMainContent
          currentLesson={currentLesson}
          course={course}
          progress={progress}
          completedLessons={completedLessons}
          markAsComplete={markAsComplete}
          showQuiz={showQuiz}
          setShowQuiz={setShowQuiz}
          quizAnswers={quizAnswers}
          setQuizAnswers={setQuizAnswers}
          quizSubmitted={quizSubmitted}
          setQuizSubmitted={setQuizSubmitted}
          quizScore={quizScore}
          setQuizScore={setQuizScore}
          allLessons={allLessons}
          navigateLesson={navigateLesson}
          contentRef={contentRef as React.RefObject<HTMLDivElement>}
        />
      </div>
      {/* AI Assistant */}
      <LessonAssistant
        showAssistant={showAssistant}
        setShowAssistant={setShowAssistant}
        chatHistory={chatHistory}
        userMessage={userMessage}
        setUserMessage={setUserMessage}
        handleAssistantSubmit={handleAssistantSubmit}
      />
    </div>
  )
}
