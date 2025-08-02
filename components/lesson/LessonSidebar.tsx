import React from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Clock, X } from "lucide-react"

interface LessonSidebarProps {
  courseTitle: string
  completedLessons: string[]
  modules: any[]
  currentLessonId: string
  progress: number
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export const LessonSidebar: React.FC<LessonSidebarProps> = ({
  courseTitle,
  completedLessons,
  modules,
  currentLessonId,
  progress,
  sidebarOpen,
  setSidebarOpen,
}) => {
  // Calculate total lessons
  const totalLessons = Array.isArray(modules) ? modules.reduce((acc, m) => acc + (Array.isArray(m.lessons) ? m.lessons.length : 0), 0) : 0;
  // Calculate percent and cap at 100
  const percent = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
  const displayPercent = Math.min(percent, 100);
  
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-full max-w-sm bg-card border-r border-border flex flex-col h-full overflow-hidden transition-transform duration-300 ease-in-out top-16 lg:top-0 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg text-foreground truncate">{courseTitle}</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden h-8 w-8 p-0 flex-shrink-0" 
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Progres Anda</span>
              <span className="text-muted-foreground font-semibold">
                {Array.isArray(completedLessons) ? completedLessons.length : 0} / {totalLessons} materi
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={displayPercent} className="h-2 flex-1 transition-all duration-500" />
              <span className="text-xs text-muted-foreground font-semibold min-w-[32px] text-right">
                {displayPercent}%
              </span>
            </div>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">
            {Array.isArray(modules) && modules
              .slice()
              .sort((a: any, b: any) => {
                // Sort by module number first
                const aModuleNum = parseInt(a.nomor_modul || a.module_number || a.number || '0');
                const bModuleNum = parseInt(b.nomor_modul || b.module_number || b.number || '0');
                if (aModuleNum !== bModuleNum) return aModuleNum - bModuleNum;
                
                // If same module, sort by lesson number
                const aLessonNum = parseFloat(a.nomor_materi || a.number || '0');
                const bLessonNum = parseFloat(b.nomor_materi || b.number || '0');
                return aLessonNum - bLessonNum;
              })
              .map((modul, idx) => (
                <div key={modul.id || idx} className="space-y-2">
                  <h3 className="font-medium text-foreground text-sm px-2 py-1 bg-muted/50 rounded-md">
                    {modul.title || `Module ${idx + 1}`}
                  </h3>
                  <ul className="space-y-1">
                    {modul.lessons
                      ?.slice()
                      .sort((a: any, b: any) => {
                        // Sort lessons by nomor_materi (e.g., "1.1", "1.2", "2.1")
                        const aNum = parseFloat(a.nomor_materi || a.number || '0');
                        const bNum = parseFloat(b.nomor_materi || b.number || '0');
                        return aNum - bNum;
                      })
                      .map((lesson: any) => (
                        <li key={lesson.id}>
                          <Link
                            href={`/course/${lesson.courseId || modul.id}/learn/${lesson.id}`}
                            className={cn(
                              "block p-3 rounded-md transition-colors text-sm",
                              currentLessonId === lesson.id 
                                ? "bg-primary/10 text-primary font-semibold border border-primary/20" 
                                : "hover:bg-accent hover:text-foreground text-muted-foreground",
                            )}
                            onClick={() => setSidebarOpen(false)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex-shrink-0">
                                {completedLessons.includes(lesson.id) ? (
                                  <div className="w-4 h-4 text-primary">
                                    <svg role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16px" height="16px">
                                      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <path d="m9 11l3 3L22 4" />
                                      </g>
                                    </svg>
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 border-2 border-muted rounded-full bg-muted"></div>
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className={cn(
                                  "font-medium break-words line-clamp-2", 
                                  currentLessonId === lesson.id && "font-semibold"
                                )}>
                                  {lesson.title.replace(/^lesson-\d+(\.\d+)?\s*/i, "")}
                                </div>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  )
} 