import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseMarkdownToLessonJSON } from "@/lib/utils/lessonParser";
import "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { markdown, meta } = await req.json();
    if (!markdown || !meta?.course_id || !meta?.title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const lessonJSON = parseMarkdownToLessonJSON(markdown, meta);
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data, error } = await supabase.from("materi").insert([
      {
        kursus_id: meta.course_id,
        judul: lessonJSON.title,
        konten: JSON.stringify(lessonJSON),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 