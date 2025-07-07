"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const { lessonId, id: courseId } = params;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lesson, setLesson] = useState({
    title: "",
    content: "",
    youtube_url: ""
  });

  useEffect(() => {
    async function fetchLesson() {
      setLoading(true);
      const { data, error } = await supabase
        .from("lessons")
        .select("title, content, youtube_url")
        .eq("id", lessonId)
        .single();
      if (error) {
        toast({ title: "Lesson not found", description: error.message, variant: "destructive" });
        router.push(`/dashboard/course/${courseId}/learn`);
        return;
      }
      setLesson({
        title: data.title || "",
        content: data.content || "",
        youtube_url: data.youtube_url || ""
      });
      setLoading(false);
    }
    if (lessonId) fetchLesson();
  }, [lessonId, courseId, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("lessons")
      .update({
        title: lesson.title,
        content: lesson.content,
        youtube_url: lesson.youtube_url
      })
      .eq("id", lessonId);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Lesson updated", description: "Lesson has been updated successfully." });
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Edit Lesson</h1>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Lesson Name</label>
          <Input
            value={lesson.title}
            onChange={e => setLesson(l => ({ ...l, title: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Lesson Content</label>
          <Textarea
            value={lesson.content}
            onChange={e => setLesson(l => ({ ...l, content: e.target.value }))}
            rows={8}
            required
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">YouTube Link</label>
          <Input
            value={lesson.youtube_url}
            onChange={e => setLesson(l => ({ ...l, youtube_url: e.target.value }))}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </div>
  );
} 