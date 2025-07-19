/**
 * Type definitions untuk struktur data lesson
 * File ini mendefinisikan interface dan type untuk data pelajaran
 */

// Union type untuk berbagai jenis section dalam pelajaran
export type LessonSection =
  | { type: "markdown"; data: string }                    // Section berisi markdown text
  | { type: "image"; data: { url: string; caption?: string } }    // Section berisi gambar dengan caption opsional
  | { type: "video"; data: { url: string; caption?: string } };   // Section berisi video dengan caption opsional

// Interface untuk struktur data lesson lengkap
export interface LessonJSON {
  id: string;              // ID unik pelajaran
  title: string;           // Judul pelajaran
  description?: string;    // Deskripsi pelajaran (opsional)
  sections: LessonSection[]; // Array section yang membentuk konten pelajaran
  created_at: string;      // Timestamp pembuatan
  updated_at: string;      // Timestamp update terakhir
} 