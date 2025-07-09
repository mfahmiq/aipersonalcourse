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
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism"

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
  setSidebarOpen: (open: boolean) => void
}

// Fungsi untuk mengekstrak referensi dari konten lesson
function extractReferencesFromContent(content: string) {
  // Deteksi section referensi (## Referensi atau Referensi) dan ambil baris-barisnya
  const match = content.match(/(?:##?\s*Referensi|References?)([\s\S]*)/i);
  if (!match) return [];
  const lines = match[1].split(/\n|\r/).map(l => l.trim()).filter(Boolean);
  // Deteksi url di setiap baris
  return lines.map(line => {
    // Ambil url mentah pertama di baris (bukan markdown link)
    const urlMatch = line.match(/(https?:\/\/[^\s\[\]\(\)]+)/);
    if (!urlMatch) return null;
    let url = urlMatch[1];
    // Validasi url
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) return null;
    } catch {
      return null;
    }
    // Ambil judul/tulisan sebelum url
    let [beforeUrl] = line.split(url);
    // Hilangkan spasi dan tanda '[' atau '-' di akhir jika ada
    beforeUrl = beforeUrl.replace(/\s*\[$/, '').replace(/\s*-\s*$/, '').trim();
    // Ambil nomor referensi jika ada di awal
    const numMatch = beforeUrl.match(/^\[(\d+)\]/);
    const number = numMatch ? numMatch[1] : null;
    return { text: beforeUrl, url, number };
  }).filter(Boolean);
}

// Fungsi untuk menghapus section Referensi dari isi lesson
function removeReferencesSection(content: string) {
  // Hapus section Referensi (atau References) dan seluruh baris setelahnya
  return content.replace(/(?:##?\s*Referensi|References?)([\s\S]*)/i, "").trim();
}

// Fungsi untuk meng-link-kan sitasi [n] ke daftar referensi
function linkifyCitations(content: string, references: any[]) {
  // Ganti [n] dengan anchor jika n ada di daftar referensi
  return content.replace(/\[(\d+)\]/g, (match, num) => {
    if (references.some(ref => ref.number === num)) {
      return `<a href="#ref-${num}" class="text-blue-600 underline" style="cursor:pointer">[${num}]</a>`;
    }
    return match;
  });
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
  setSidebarOpen,
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
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 w-full lg:w-auto mb-4 sm:mb-0">
          <Button
            variant="outline"
            size="sm"
            className="block lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            ☰ Lessons
          </Button>
          <Button
            onClick={markAsComplete}
            disabled={completedLessons.includes(currentLesson.id)}
            size="sm"
            className={cn(
              "px-3 py-1.5 flex items-center gap-2 transition-colors",
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
          {currentLesson?.id && typeof currentLesson.id === 'string' && currentLesson.id !== 'undefined.1' && currentLesson.id !== '' && (
            <Link href={`/dashboard/course/${course?.courseId || course?.id}/learn/${currentLesson.id}/edit`}>
              <Button size="sm" variant="outline" aria-label="Edit Lesson">
                Edit
              </Button>
            </Link>
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
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={{
              code(props: any) {
                const {inline, className, children, ...rest} = props;
                const match = /language-(\w+)/.exec(className || "");
                if (!inline && match) {
                  return (
                    <SyntaxHighlighter
                      style={coldarkDark as { [key: string]: React.CSSProperties }}
                      language={match[1]}
                      PreTag="div"
                      {...rest}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  );
                }
                return <code className={className} {...rest}>{children}</code>;
              },
              pre({children, ...props}) {
                return (
                  <pre className="bg-muted border rounded p-4 overflow-x-auto my-4" {...props}>
                    {children}
                  </pre>
                );
              }
            }}
          >{linkifyCitations(removeReferencesSection(currentLesson.content), extractReferencesFromContent(currentLesson.content || ""))}</ReactMarkdown>
          {/* Render referensi jika ada */}
          {(() => {
            const refs = extractReferencesFromContent(currentLesson.content || "");
            if (refs.length === 0) return null;
            return (
              <div className="mt-8 border-t pt-4">
                <div className="font-semibold mb-2">Referensi</div>
                <ol className="list-decimal ml-6 space-y-1">
                  {refs.map((ref: any, idx: number) => (
                    <li key={idx} id={ref.number ? `ref-${ref.number}` : undefined}>
                      <a href={ref.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        {ref.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            );
          })()}
        </div>
      </div>
      {/* Quiz Section */}
      
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