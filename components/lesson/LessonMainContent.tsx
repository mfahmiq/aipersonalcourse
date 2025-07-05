import React, { RefObject } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { ChevronLeft, ChevronRight, FileText, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import { YouTubePlayer } from "@/components/ui/youtube-player"
import { FlashCard } from "./FlashCard"
import Link from "next/link"

interface LessonMainContentProps {
  currentLesson: any
  course: any
  progress: number
  completedLessons: string[]
  markAsComplete: () => void
  showQuiz: boolean
  setShowQuiz: (show: boolean) => void
  quizAnswers: Record<number, number>
  setQuizAnswers: (answers: Record<number, number>) => void
  quizSubmitted: boolean
  setQuizSubmitted: (submitted: boolean) => void
  quizScore: number
  setQuizScore: (score: number) => void
  allLessons: any[]
  navigateLesson: (dir: "next" | "prev") => void
  contentRef: RefObject<HTMLDivElement>
}

export const LessonMainContent: React.FC<LessonMainContentProps> = ({
  currentLesson,
  course,
  progress,
  completedLessons,
  markAsComplete,
  showQuiz,
  setShowQuiz,
  quizAnswers,
  setQuizAnswers,
  quizSubmitted,
  setQuizSubmitted,
  quizScore,
  setQuizScore,
  allLessons,
  navigateLesson,
  contentRef,
}) => {
  if (!currentLesson) return <div>Lesson not found</div>;

  const [currentFlashIndex, setCurrentFlashIndex] = React.useState(0);
  const [flashSelections, setFlashSelections] = React.useState<Record<number, number | null>>({});
  const [flashShowAnswer, setFlashShowAnswer] = React.useState<Record<number, boolean>>({});

  // Reset flashcard state when lesson/quiz berubah
  React.useEffect(() => {
    setCurrentFlashIndex(0);
    setFlashSelections({});
    setFlashShowAnswer({});
  }, [currentLesson?.id, showQuiz]);

  return (
    <div className="max-w-4xl mx-auto py-4 lg:py-6 px-3">
      {/* Lesson Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{currentLesson.title}</h1>
          <div className="flex items-center mt-2 text-muted-foreground">
            <Clock className="h-4 w-4 mr-1" />
            <span>{currentLesson.duration}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
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
          {/* Tombol Edit hanya jika id valid */}
          {currentLesson?.id ? (
            <Link href={`/dashboard/course/${course?.courseId || course?.id}/learn/${currentLesson.id}/edit`}>
              <Button size="icon" variant="outline" className="ml-2" aria-label="Edit Lesson">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m2-2l-6 6m2-2l6-6" />
                </svg>
              </Button>
            </Link>
          ) : (
            <Button size="icon" variant="outline" className="ml-2" aria-label="Edit Lesson" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m2-2l-6 6m2-2l6-6" />
              </svg>
            </Button>
          )}
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
          <h2 className="text-xl font-semibold text-foreground">{currentLesson.title}</h2>
        </div>
        <div className="prose max-w-none text-foreground">
          <ReactMarkdown rehypePlugins={[rehypeRaw]}>{currentLesson.content}</ReactMarkdown>
        </div>
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
                  <div className={cn(
                    "text-2xl font-bold mb-2",
                    quizScore >= 80 ? "text-primary" : quizScore >= 60 ? "text-amber-500" : "text-destructive",
                  )}>
                    Your Score: {quizScore}%
                  </div>
                  <p className="text-muted-foreground">
                    {quizScore >= 80
                      ? "Great job! You've mastered this lesson."
                      : quizScore >= 60
                        ? "Good effort! Review the material to improve your understanding."
                        : "Keep practicing! You'll get there."}
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
                  Retake Quiz
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <FlashCard
                  question={currentLesson.quiz.questions[currentFlashIndex].question}
                  options={currentLesson.quiz.questions[currentFlashIndex].options}
                  correct={currentLesson.quiz.questions[currentFlashIndex].correct}
                  selected={flashSelections[currentFlashIndex] ?? null}
                  onSelect={(idx) => setFlashSelections({ ...flashSelections, [currentFlashIndex]: idx })}
                  showAnswer={!!flashShowAnswer[currentFlashIndex]}
                  onFlip={() => setFlashShowAnswer({ ...flashShowAnswer, [currentFlashIndex]: !flashShowAnswer[currentFlashIndex] })}
                />
                <div className="flex justify-between gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentFlashIndex((i) => Math.max(0, i - 1))}
                    disabled={currentFlashIndex === 0}
                  >
                    Sebelumnya
                  </Button>
                  {Array.isArray(currentLesson.quiz?.questions) && currentFlashIndex < currentLesson.quiz.questions.length - 1 ? (
                    <Button
                      variant="outline"
                      onClick={() => setCurrentFlashIndex((i) => Math.min(Array.isArray(currentLesson.quiz?.questions) ? currentLesson.quiz.questions.length - 1 : 0, i + 1))}
                      disabled={Array.isArray(currentLesson.quiz?.questions) ? currentFlashIndex === currentLesson.quiz.questions.length - 1 : true}
                    >
                      Selanjutnya
                    </Button>
                  ) : (
                    <Button
                      className="bg-primary text-primary-foreground"
                      onClick={() => {
                        // Hitung skor
                        let correctAnswers = 0;
                        currentLesson.quiz.questions.forEach((q: any, idx: number) => {
                          if (flashSelections[idx] === q.correct) correctAnswers++;
                        });
                        const score = Array.isArray(currentLesson.quiz?.questions) && currentLesson.quiz.questions.length > 0 ? Math.round((correctAnswers / currentLesson.quiz.questions.length) * 100) : 0;
                        setQuizScore(score);
                        setQuizSubmitted(true);
                      }}
                      disabled={Object.keys(flashSelections).length < (Array.isArray(currentLesson.quiz?.questions) ? currentLesson.quiz.questions.length : 0)}
                    >
                      Submit Quiz
                    </Button>
                  )}
                </div>
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
          disabled={Array.isArray(allLessons) && allLessons.findIndex((l) => l.id === currentLesson.id) === 0}
          className="w-full sm:w-auto px-3 py-1.5"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous Lesson
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateLesson("next")}
          disabled={Array.isArray(allLessons) && allLessons.findIndex((l) => l.id === currentLesson.id) === allLessons.length - 1}
          className="w-full sm:w-auto px-3 py-1.5"
        >
          Next Lesson
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
} 