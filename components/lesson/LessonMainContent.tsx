import React, { RefObject, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, FileText, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import { YouTubePlayer } from "@/components/ui/youtube-player"
import Link from "next/link"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { coldarkDark } from "react-syntax-highlighter/dist/esm/styles/prism"
import { LessonJSON } from "../../lib/utils/lessonTypes";

interface LessonMainContentProps {
  currentLesson: any
  course: any
  progress: number
  completedLessons: string[]
  markAsComplete: () => void
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

// Fungsi untuk membersihkan dan merapikan konten lesson
function cleanLessonContent(content: string) {
  // Hilangkan section kosong dan header yang tidak diikuti konten
  let cleaned = content
  
  // Tambahkan jarak antar paragraf, tapi jangan di dalam blok tabel
  const lines = cleaned.split('\n');
  let result = [];
  let inTable = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Deteksi awal tabel markdown
    if (line.trim().startsWith('|')) inTable = true;
    // Deteksi akhir tabel markdown (baris kosong setelah tabel)
    if (inTable && line.trim() === '') inTable = false;
    result.push(line);
    // Tambahkan newline ekstra hanya jika bukan di dalam tabel dan baris berikutnya bukan bagian tabel
    if (!inTable && line.trim() !== '' && lines[i+1] && lines[i+1].trim() !== '' && !lines[i+1].trim().startsWith('|')) {
      result.push('');
    }
  }
  return result.join('\n').trim();
}

// Fungsi untuk menghapus citation seperti [1], [2], [1, 2, 7] di luar code block
function removeInlineCitationsOutsideCode(content: string) {
  // Pisahkan konten berdasarkan code block (```...```)
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts.map(part => {
    // Jika part adalah code block, biarkan
    if (/^```[\s\S]*```$/.test(part)) return part;
    // Jika bukan code block, hapus citation
    return part.replace(/\[(\d+(?:,\s*\d+)*)\]/g, "");
  }).join("");
}

// Fungsi untuk menghapus heading 'Common Pitfalls' dari konten lesson
function removeCommonPitfallsHeading(content: string) {
  // Hapus baris header seperti '# Common Pitfalls', '## Common Pitfalls', dst.
  return content.replace(/^#+\s*Common Pitfalls\s*$/gim, "");
}

// Fungsi untuk menghapus heading tertentu dari konten lesson


// Fungsi untuk menambah dua baris kosong antar paragraf
function addDoubleSpacingBetweenParagraphs(content: string) {
  // Tambahkan dua baris kosong antar paragraf, kecuali di dalam tabel atau code block
  // Ganti satu baris kosong antar paragraf menjadi dua baris kosong
  return content.replace(/([^\n])\n(?=[^\n])/g, '$1\n\n');
}

export const LessonMainContent: React.FC<LessonMainContentProps> = ({
  currentLesson,
  course,
  progress,
  completedLessons,
  markAsComplete,
  allLessons,
  navigateLesson,
  contentRef,
  setSidebarOpen,
}) => {
  // State to keep track of h1 count for numbering
  const h1CountRef = useRef(0);

  if (!currentLesson) return <div>Lesson not found</div>;

  // Reset h1 count before each render
  h1CountRef.current = 0;

  // Flatten all lessons for navigation
  const flatLessons = Array.isArray(allLessons) && allLessons[0]?.lessons
    ? allLessons.flatMap((mod: any) => mod.lessons)
    : allLessons;
  const currentIdx = flatLessons.findIndex((l: any) => l.id === currentLesson.id);

  return (
    <div className="max-w-4xl mx-auto py-4 lg:py-6 px-3">
      {/* Lesson Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">{currentLesson.title}</h1>
          {/* Removed duration/time display here */}
        </div>
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2 w-full lg:w-auto mb-4 sm:mb-0">
          <Button
            variant="outline"
            size="sm"
            className="block lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            ☰ Daftar Materi
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
                <span>Selesai</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 mr-2 rounded-full border-2 border-current"></div>
                <span>Tandai Selesai</span>
              </>
            )}
          </Button>
          {currentLesson?.id && typeof currentLesson.id === 'string' && currentLesson.id !== 'undefined.1' && currentLesson.id !== '' && (
            <Link href={`/course/${course?.courseId || course?.id}/learn/${currentLesson.id}/edit`}>
              <Button size="sm" variant="outline" aria-label="Edit Lesson">
                Edit
              </Button>
            </Link>
          )}
        </div>
      </div>
      {/* Video Player */}
      <YouTubePlayer
        videoUrl={currentLesson.videoUrl}
        lessonTitle={currentLesson.title}
        lessonContent={typeof currentLesson.content === 'string' ? currentLesson.content : ''}
        courseTopic={course?.topic || course?.title || ''}
        courseId={course?.courseId || course?.id}
        chapterId={currentLesson.id}
      />
      {/* Lesson Content */}
      <div ref={contentRef} className="bg-card border rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center gap-2 mb-4 pb-4 border-b">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">{currentLesson.title}</h2>
        </div>
        <div
          className="prose max-w-none text-foreground"
          style={{
            marginTop: 0,
            marginBottom: 0,
            '--lesson-h1-margin': '2.5em',
            '--lesson-h2-margin': '2em',
            '--lesson-h3-margin': '1.5em',
            '--lesson-p-margin': '1.5em',
          } as React.CSSProperties}
        >
          <style>{`
            .prose h1 { font-size: 2.25rem; margin-top: var(--lesson-h1-margin); margin-bottom: var(--lesson-h1-margin); font-weight: bold; }
            .prose h2 { font-size: 1.5rem; margin-top: var(--lesson-h2-margin); margin-bottom: var(--lesson-h2-margin); font-weight: bold; }
            .prose h3 { font-size: 1.25rem; margin-top: var(--lesson-h3-margin); margin-bottom: var(--lesson-h3-margin); font-weight: 600; }
            .prose p { margin-top: var(--lesson-p-margin); margin-bottom: var(--lesson-p-margin); }
          `}</style>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
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
              },
              table: ({node, ...props}) => (
                <table className="min-w-full border border-gray-700 my-4 text-sm bg-[#181A20] dark:bg-[#181A20] text-foreground">{props.children}</table>
              ),
              thead: ({node, ...props}) => (
                <thead className="bg-gray-800 dark:bg-gray-800 text-foreground">{props.children}</thead>
              ),
              tbody: ({node, ...props}) => <tbody>{props.children}</tbody>,
              tr: ({node, ...props}) => (
                <tr className="border-b border-gray-700 dark:border-gray-700">{props.children}</tr>
              ),
              th: ({node, ...props}) => (
                <th className="px-3 py-2 text-left font-semibold border border-gray-700 dark:border-gray-700 bg-gray-900 dark:bg-gray-900 text-foreground">{props.children}</th>
              ),
              td: ({node, ...props}) => (
                <td className="px-3 py-2 border border-gray-700 dark:border-gray-700 align-top text-foreground">{props.children}</td>
              ),
              a: ({node, ...props}) => (
                <a {...props} className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">{props.children}</a>
              ),
            }}
          >
            {typeof currentLesson.konten === 'string'
                ? currentLesson.konten
                : (typeof currentLesson.content === 'string' ? currentLesson.content : '')}
          </ReactMarkdown>
        </div>
      </div>
      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mt-8 pt-4 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigateLesson("prev")}
          disabled={currentIdx === 0}
          className="w-full sm:w-auto px-3 py-1.5"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Materi Sebelumnya
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (currentIdx === flatLessons.length - 1) {
              // Optionally, handle finish logic here (e.g., show a message or redirect)
            } else {
              navigateLesson("next");
            }
          }}
          disabled={currentIdx === flatLessons.length - 1}
          className="w-full sm:w-auto px-3 py-1.5"
        >
          {currentIdx === flatLessons.length - 1 ? "Finish Lesson" : "Materi Berikutnya"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
} 