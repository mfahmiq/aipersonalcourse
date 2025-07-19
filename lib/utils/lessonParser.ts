/**
 * Lesson Parser Utility
 * File ini berisi fungsi-fungsi untuk mengkonversi markdown menjadi struktur LessonJSON
 * dan memproses konten pelajaran
 */

import { LessonJSON, LessonSection } from "./lessonTypes";

/**
 * Menghapus blok markdown global jika ada
 * Fungsi ini membersihkan markdown dari wrapper ```markdown ... ```
 * 
 * @param md - String markdown yang akan dibersihkan
 * @returns String markdown yang sudah dibersihkan
 */
function stripGlobalMarkdownBlock(md: string): string {
  // Remove global code block ```markdown ... ``` if present
  if (md.trim().startsWith("```markdown")) {
    const lines = md.trim().split("\n");
    const endIdx = lines.lastIndexOf("```", 1);
    if (endIdx > 0) {
      return lines.slice(1, endIdx).join("\n");
    }
  }
  return md;
}

/**
 * Mengkonversi markdown menjadi struktur LessonJSON
 * Fungsi ini memproses markdown dan mengubahnya menjadi format yang dapat disimpan di database
 * 
 * @param markdown - String markdown yang akan diparse
 * @param meta - Metadata pelajaran (id, title, description)
 * @returns Object LessonJSON yang sudah diparse
 */
export function parseMarkdownToLessonJSON(
  markdown: string,
  meta: { id: string; title: string; description?: string }
): LessonJSON {
  // Membersihkan markdown dari wrapper global
  markdown = stripGlobalMarkdownBlock(markdown);
  
  // Array untuk menyimpan section-section pelajaran
  const sections: LessonSection[] = [];
  
  // Buffer untuk mengumpulkan text markdown
  let buffer = "";
  
  // Memecah markdown menjadi baris-baris
  const lines = markdown.split("\n");
  
  // Mode parsing (null = markdown, "video" = parsing video, "image" = parsing image)
  let mode: null | "video" | "image" = null;
  
  // Buffer untuk mengumpulkan data blok (video/image)
  let blockBuffer: string[] = [];

  /**
   * Fungsi untuk mengosongkan buffer markdown ke sections
   * Jika buffer tidak kosong, tambahkan sebagai section markdown
   */
  function flushBuffer() {
    if (buffer.trim()) {
      sections.push({ type: "markdown", data: buffer.trim() });
      buffer = "";
    }
  }

  // Iterasi melalui setiap baris markdown
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Hapus parsing quiz dan flashcard sesuai permintaan user
    // Parsing blok video dan image jika ada, sisanya markdown
    // (implementasi detail disesuaikan kebutuhan Anda)
    
    // Untuk sementara, semua konten dianggap sebagai markdown
    buffer += line + "\n";
  }
  
  // Mengosongkan buffer terakhir
  flushBuffer();

  // Membuat timestamp untuk created_at dan updated_at
  const now = new Date().toISOString();
  
  // Mengembalikan object LessonJSON
  return {
    id: meta.id,
    title: meta.title,
    description: meta.description,
    sections,
    created_at: now,
    updated_at: now,
  };
} 