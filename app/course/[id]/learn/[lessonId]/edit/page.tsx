"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Home, ArrowLeft } from "lucide-react"

export default function EditLessonPage() {
  const { id, lessonId } = useParams();
  const router = useRouter();
  const courseId = Array.isArray(id) ? id[0] : id;
  const lessonUUID = Array.isArray(lessonId) ? lessonId[0] : lessonId; // gunakan UUID
  const supabase = createClientComponentClient();

  const [lesson, setLesson] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLesson = async () => {
      // Fetch lesson langsung berdasarkan UUID
      const { data: found, error } = await supabase
          .from("materi")
        .select("*")
        .eq("id", lessonUUID)
        .single();
      if (error || !found) {
        setError("Lesson not found");
        setLoading(false);
        return;
      }
      setLesson(found);
      
      // Fetch course data for breadcrumbs
      const { data: courseData, error: courseError } = await supabase
        .from("kursus")
        .select("judul")
        .eq("id", courseId)
        .single();
      if (!courseError && courseData) {
        setCourse(courseData);
      }
      
      setLoading(false);
    };
    if (courseId && lessonUUID) fetchLesson();
  }, [courseId, lessonUUID, supabase]);

  // Fungsi konversi link YouTube ke format embed
  function convertToEmbedUrl(url: string): string {
    if (!url) return '';
    // youtu.be/xxxx
    const shortMatch = url.match(/youtu\.be\/([\w-]+)/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }
    // youtube.com/watch?v=xxxx
    const longMatch = url.match(/[?&]v=([\w-]+)/);
    if (longMatch) {
      return `https://www.youtube.com/embed/${longMatch[1]}`;
    }
    // youtube.com/embed/xxxx
    const embedMatch = url.match(/embed\/([\w-]+)/);
    if (embedMatch) {
      return `https://www.youtube.com/embed/${embedMatch[1]}`;
    }
    // Jika tidak cocok, kembalikan as is
    return url;
  }

  const handleSave = async () => {
    if (!lesson) return;
    setSaving(true);
    // Konversi video_url ke embed sebelum simpan
    const embedUrl = convertToEmbedUrl(lesson.url_video || "");
    const { error } = await supabase
          .from("materi")
      .update({ judul: lesson.judul, konten: lesson.konten, url_video: embedUrl })
      .eq("id", lesson.id);
    setSaving(false);
    if (error) {
      setError("Gagal menyimpan materi: " + error.message);
      return;
    }
    router.push(`/course/${courseId}/learn/${lesson.id}`); // navigasi pakai UUID
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-600">{error === "Lesson not found" ? "Materi tidak ditemukan" : error}</div>;

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
          Dashboard
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href="/course" className="hover:text-foreground transition-colors">
          Kursus
        </Link>
        <span className="text-muted-foreground">/</span>
        <Link href={`/course/${courseId}/learn/${lesson.id}`} className="hover:text-foreground transition-colors">
          {lesson?.judul || "Materi"}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium">Edit</span>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/course/${courseId}/learn/${lesson.id}`)}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Materi
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-4">Edit Materi</h1>
      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Judul</label>
          <Input
            value={lesson.judul}
            onChange={e => setLesson((l: any) => ({ ...l, judul: e.target.value }))}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Konten (Markdown)</label>
          <Textarea
            rows={12}
            value={lesson.konten}
            onChange={e => setLesson((l: any) => ({ ...l, konten: e.target.value }))}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">URL Video (YouTube)</label>
          <Input
            value={lesson.url_video || ''}
            onChange={e => setLesson((l: any) => ({ ...l, url_video: e.target.value }))}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
      </div>
      <div className="flex gap-2 mt-6">
        <Button onClick={handleSave} disabled={saving} className="bg-primary text-white">
          {saving ? "Menyimpan..." : "Simpan"}
        </Button>
        <Button variant="outline" onClick={() => router.push(`/course/${courseId}/learn/${lesson.id}`)}>
          Batal
        </Button>
      </div>
      {error && <div className="text-red-600 mt-4">{error}</div>}
    </div>
  );
} 