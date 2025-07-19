/**
 * Lesson Insert API Route
 * File ini menyediakan endpoint untuk menyimpan pelajaran baru ke database
 * Mengkonversi markdown menjadi JSON dan menyimpannya ke tabel course_chapters
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseMarkdownToLessonJSON } from "@/lib/utils/lessonParser";
import "@/lib/supabase";

/**
 * POST handler untuk menyimpan pelajaran baru
 * Menerima markdown content dan metadata, lalu menyimpannya ke database
 * 
 * @param req - NextRequest object dengan body berisi markdown dan meta
 * @returns JSON response dengan status success atau error
 */
export async function POST(req: NextRequest) {
  try {
    // Mengambil data dari request body
    const { markdown, meta } = await req.json();
    
    // Validasi field yang diperlukan
    if (!markdown || !meta?.course_id || !meta?.title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Mengkonversi markdown menjadi struktur LessonJSON
    const lessonJSON = parseMarkdownToLessonJSON(markdown, meta);
    
    // Membuat Supabase client untuk operasi database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Menyimpan pelajaran ke tabel course_chapters
    const { data, error } = await supabase.from("course_chapters").insert([
      {
        course_id: meta.course_id,                    // ID kursus yang terkait
        title: lessonJSON.title,                      // Judul pelajaran
        content: JSON.stringify(lessonJSON),          // Konten dalam format JSON string
        created_at: new Date().toISOString(),         // Timestamp pembuatan
        updated_at: new Date().toISOString(),         // Timestamp update
      },
    ]);
    
    // Handle error jika ada
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // Return success response
    return NextResponse.json({ success: true, data });
  } catch (e: any) {
    // Handle unexpected errors
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
} 