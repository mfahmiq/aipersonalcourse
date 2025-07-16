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
  const [showAssistant, setShowAssistant] = useState(false)
  const [assistantMessage, setAssistantMessage] = useState("")
  const [userMessage, setUserMessage] = useState("")
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const contentRef = useRef<HTMLDivElement>(null)

  const supabase = createClientComponentClient();

  // Load course data and current lesson
  useEffect(() => {
    // Fetch course data from Supabase
    const fetchCourseAndLessons = async () => {
      try {
        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session || !session.user?.id) {
          router.push("/login");
          return;
        }
        const userId = session.user.id;
        // Fetch course
        const { data: courseData, error: courseError } = await supabase.from("courses").select("*").eq("id", courseId).single();
        if (courseError) {
          console.error("Error fetching course:", courseError, "courseId:", courseId);
          router.push("/dashboard/course");
          return;
        }
        if (!courseData) {
          console.error("No course data found for courseId:", courseId);
          router.push("/dashboard/course");
          return;
        }
        // Access control: Only owner can access
        if (courseData.user_id !== userId) {
          alert("Anda tidak memiliki akses ke kursus ini.");
          router.push("/dashboard/course");
          return;
        }
        const validatedCourse = {
          ...courseData,
          courseId: courseData.id,
          title: courseData.title || "Kursus Tanpa Judul",
          description: courseData.description || "Tidak ada deskripsi",
        };
        setCourse(validatedCourse);

        // Fetch lessons from course_chapters
        const { data: chapters, error: chaptersError } = await supabase
          .from("course_chapters")
          .select("*")
          .eq("course_id", courseId)
          .order("module_number", { ascending: true })
          .order("number", { ascending: true });
        if (chaptersError) {
          console.error("Error fetching course chapters:", chaptersError);
          setAllLessons([]);
          return;
        }

        // Group chapters by module_title
        const modulesMap: Record<string, any[]> = {};
        chapters.forEach((chapter: any) => {
          const modTitle = chapter.module_title || 'Module';
          if (!modulesMap[modTitle]) modulesMap[modTitle] = [];
          modulesMap[modTitle].push({
            id: chapter.id,
            title: chapter.title,
            number: chapter.number,
            duration: chapter.duration || "15 min",
            content: chapter.content,
            videoUrl: chapter.video_url,
            moduleId: modTitle,
            moduleTitle: modTitle,
            courseId: validatedCourse.courseId,
          });
        });
        const modules = Object.entries(modulesMap).map(([title, lessons], idx) => ({
          title,
          lessons: lessons.slice().sort((a: any, b: any) => (a.number || '').localeCompare(b.number || '')),
        }));
        setAllLessons(modules);

        // Set current lesson by lessonOrder (for navigation), but use UUID for id
        const foundLesson = allLessons.find((mod) => mod.lessons.find((l: any) => String(l.lessonOrder) === String(currentLessonId) || String(l.id) === String(currentLessonId)));
        if (foundLesson) {
          setCurrentLesson(foundLesson.lessons.find((l: any) => String(l.lessonOrder) === String(currentLessonId) || String(l.id) === String(currentLessonId)));
          setCurrentModule(foundLesson);
        } else if (allLessons.length > 0) {
          // If lesson not found, redirect to first lesson
          router.push(`/dashboard/course/${courseId}/learn/${allLessons[0].lessons[0].lessonOrder}`);
        }

        // Set completed lessons from course.completed_lessons
        setCompletedLessons(courseData.completed_lessons || []);

        // Calculate progress from courseData.progress
        setProgress(courseData.progress ?? 0);
      } catch (error) {
        console.error("Error fetching course or lessons:", error);
        router.push("/dashboard/course");
      }
    };
    fetchCourseAndLessons();
  }, [courseId, currentLessonId, router]);

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

  // Mark lesson as complete
  const markAsComplete = async () => {
    if (!currentLesson || !course) return;

    const updatedCompleted = [...completedLessons];
    if (!updatedCompleted.includes(currentLesson.id)) {
      updatedCompleted.push(currentLesson.id);
    }
    setCompletedLessons(updatedCompleted);

    // Calculate total lessons (flatten allLessons if needed)
    let totalLessons = 0;
    if (Array.isArray(allLessons)) {
      if (allLessons.length > 0 && allLessons[0].lessons) {
        // allLessons is array of modules
        totalLessons = allLessons.reduce((acc, mod) => acc + (mod.lessons?.length || 0), 0);
      } else {
        // allLessons is flat array
        totalLessons = allLessons.length;
      }
    }

    // Calculate new progress percentage
    const newProgress = totalLessons > 0 ? Math.round((updatedCompleted.length / totalLessons) * 100) : 0;
    setProgress(newProgress);

    // Update progress and completed lessons in courses table
    try {
      await supabase
        .from("courses")
        .update({ progress: newProgress, completed_lessons: updatedCompleted, updated_at: new Date().toISOString() })
        .eq("id", courseId);
      console.log("Course progress and completed lessons updated in Supabase");
    } catch (err: any) {
      console.error("Error updating course progress in Supabase:", err);
    }
  };

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
      const newChat = [...updatedChat, { role: "assistant", content: response }]
      setChatHistory(newChat)

      // Save Q&A to Supabase (chatbot_qa in course_chapters)
      if (currentLesson && currentLesson.courseId) {
        // Fetch the chapter row by course_id and lesson title (or use lesson id if available)
        const { data: chapters, error: chaptersError } = await supabase
          .from("course_chapters")
          .select("id,chatbot_qa")
          .eq("course_id", currentLesson.courseId)
          .eq("title", currentLesson.title)
          .limit(1)
        if (!chaptersError && chapters && chapters.length > 0) {
          const chapter = chapters[0]
          const prevQA = Array.isArray(chapter.chatbot_qa) ? chapter.chatbot_qa : []
          const newQA = [
            ...prevQA,
            { question: userMessage, answer: response }
          ]
          await supabase
            .from("course_chapters")
            .update({ chatbot_qa: newQA })
            .eq("id", chapter.id)
          // Fetch updated Q&A and update local chatHistory
          const { data: updatedChapters } = await supabase
            .from("course_chapters")
            .select("chatbot_qa")
            .eq("id", chapter.id)
            .single()
          if (updatedChapters && Array.isArray(updatedChapters.chatbot_qa)) {
            setChatHistory(updatedChapters.chatbot_qa.map((item: any) => [
              { role: "user", content: item.question },
              { role: "assistant", content: item.answer }
            ]).flat())
          }
        }
      }
    } catch (err) {
      setChatHistory([...updatedChat, { role: "assistant", content: "Maaf, saya tidak bisa mendapatkan jawaban dari AI saat ini." }])
    }
  }

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  // Fungsi navigasi lesson sebelumnya/berikutnya
  const navigateLesson = (dir: "next" | "prev") => {
    // Flatten all lessons
    const flatLessons = Array.isArray(allLessons) && allLessons[0]?.lessons
      ? allLessons.flatMap((mod: any) => mod.lessons)
      : allLessons;
    const currentIdx = flatLessons.findIndex((l: any) => l.id === currentLesson?.id);
    if (currentIdx === -1) return;
    let targetIdx = dir === "next" ? currentIdx + 1 : currentIdx - 1;
    if (targetIdx < 0 || targetIdx >= flatLessons.length) return;
    const targetLesson = flatLessons[targetIdx];
    if (targetLesson && targetLesson.id) {
      router.push(`/dashboard/course/${courseId}/learn/${targetLesson.id}`);
    }
  };

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
                courseId: course.courseId,
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
    return null;
  }
  if (!currentLesson) {
    // Try to find lesson by normalized id
    const foundLesson = allLessons.find((mod) => mod.lessons.find((l: any) => String(l.id) === String(currentLessonId)));
    if (foundLesson) {
      setCurrentLesson(foundLesson.lessons.find((l: any) => String(l.id) === String(currentLessonId)));
      return null;
    }
    return null;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden fixed inset-0 w-full pt-16">
      {/* Sidebar */}
      <LessonSidebar
        courseTitle={course?.title || ""}
        completedLessons={completedLessons}
        modules={allLessons}
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
          allLessons={allLessons}
          navigateLesson={navigateLesson}
          contentRef={contentRef as React.RefObject<HTMLDivElement>}
          setSidebarOpen={setSidebarOpen}
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
