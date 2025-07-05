import React from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"

interface LessonSidebarProps {
  courseTitle: string
  completedLessons: string[]
  allLessons: any[]
  currentLessonId: string
  progress: number
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const LessonSidebar: React.FC<LessonSidebarProps> = ({
  courseTitle,
  completedLessons,
  allLessons,
  currentLessonId,
  progress,
  sidebarOpen,
  setSidebarOpen,
}) => {
  return (
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
          <h2 className="font-bold text-lg text-foreground">{courseTitle}</h2>
          <div className="mt-2">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-muted-foreground font-medium">Your Progress</span>
              <span className="text-muted-foreground font-semibold">{Array.isArray(completedLessons) ? completedLessons.length : 0} / {Array.isArray(allLessons) ? allLessons.length : 0} lessons</span>
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
        <div className="space-y-6">
          {Array.from(new Set(allLessons.map((l) => l.moduleId))).map((moduleId) => {
            const moduleTitle = allLessons.find((l) => l.moduleId === moduleId)?.moduleTitle
            const moduleLessons = allLessons.filter((l) => l.moduleId === moduleId)
            return (
              <div key={moduleId} className="mb-2">
                <h3 className="font-medium text-foreground mb-2 break-words">{moduleTitle}</h3>
                <ul className="space-y-2">
                  {moduleLessons.map((lesson) => (
                    <li key={`${lesson.moduleId || 'mod'}-${lesson.id}`}>
                      <Link
                        href={`/dashboard/course/${lesson.courseId || lesson.moduleId}/learn/${lesson.id}`}
                        className={cn(
                          "block p-3 rounded-md transition-colors",
                          currentLessonId === lesson.id ? "bg-primary/10 text-primary font-semibold" : "hover:bg-accent hover:text-foreground text-muted-foreground",
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
                              <div className="w-5 h-5 border-2 border-muted rounded-full bg-muted"></div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className={cn("font-medium break-words", currentLessonId === lesson.id && "font-semibold")}>{lesson.title.replace(/^lesson-\d+(\.\d+)?\s*/i, "")}</div>
                            <div className="flex items-center text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1 text-current" />
                              {lesson.duration || "-"}
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
  )
} 