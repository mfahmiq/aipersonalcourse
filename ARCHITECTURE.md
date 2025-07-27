# Arsitektur Proyek: AI Personal Course

## Overview
Proyek ini adalah platform pembelajaran personal berbasis AI yang memungkinkan pengguna membuat, mengelola, dan mempelajari kursus secara otomatis dengan bantuan AI dan integrasi YouTube. Aplikasi dibangun menggunakan **Next.js** (React), **Supabase** (backend & database), serta integrasi **Google Gemini AI** dan **YouTube API**.

---

## 1. Struktur Folder Utama

- `app/`         : Routing, halaman, dan API routes Next.js (termasuk dashboard, auth, login, register, dsb)
- `components/`  : Komponen UI (navbar, sidebar, lesson, theme, dsb)
- `hooks/`       : Custom React hooks
- `lib/`         : Utility, integrasi Supabase, Gemini, YouTube, dan helper lain
- `public/`      : Aset statis (gambar, logo, dsb)
- `styles/`      : File CSS global
- `supabase/`    : Migrasi skema database

---

## 2. Teknologi & Framework

- **Frontend**: Next.js (React 18), TailwindCSS, shadcn/ui, Radix UI
- **Backend**: Next.js API Routes, Supabase (PostgreSQL, Auth, Storage)
- **AI**: Google Gemini (generasi outline, lesson, asisten)
- **Video**: YouTube API (embed & pencarian video otomatis)
- **Auth**: Supabase Auth (email/password)

---

## 3. Alur Data & Fitur Utama

### a. Autentikasi
- Menggunakan Supabase Auth (email/password)
- Middleware Next.js memastikan route yang dilindungi hanya bisa diakses user login

### b. Outline & Course Generation
- User membuat outline kursus (judul, topik, dsb)
- AI Gemini menghasilkan struktur outline & lesson
- Data outline/lesson disimpan di Supabase (tabel: outlines, kursus, materi)

### c. Pembelajaran & Video
- Halaman belajar menampilkan konten lesson
- Video YouTube otomatis dicari & di-embed sesuai topik lesson
- Komponen utama: `LessonMainContent`, `LessonSidebar`, `LessonAssistant`, `youtube-player`

### d. Asisten AI
- Fitur tanya-jawab lesson menggunakan Gemini AI
- Riwayat chat disimpan di Supabase (tabel: chatbot_histories)

---

## 4. Integrasi Eksternal
- **Supabase**: Backend utama (auth, database, API)
- **Google Gemini**: Generasi konten (outline, lesson, asisten)
- **YouTube API**: Pencarian & embed video edukasi

---

## 5. Skema Database (Ringkasan)
- **users**: Data user
- **outlines**: Outline kursus
- **courses**: Kursus yang di-generate
- **materi**: Konten lesson
- **chatbot_histories**: Riwayat tanya-jawab AI
- **settings**: Profil user

---

## 6. Alur Utama Pengguna
1. **Register/Login**
2. **Buat Outline** → AI generate struktur kursus
3. **Generate Course** → AI generate lesson
4. **Belajar** → Baca lesson, tonton video, tanya asisten AI
5. **Progress & Statistik**

---

## 7. Dependensi Penting
- `next`, `react`, `@supabase/supabase-js`, `@google/generative-ai`, `tailwindcss`, `shadcn/ui`, `lucide-react`, `framer-motion`, dsb.

---

## 8. Referensi File Kunci
- `app/layout.tsx`         : Root layout & provider
- `app/dashboard/`         : Halaman utama user
- `app/api/`               : API routes (lesson, youtube)
- `lib/supabase.ts`        : Inisialisasi Supabase
- `lib/utils/gemini.ts`    : Integrasi Gemini AI
- `lib/youtube.ts`         : Integrasi YouTube API
- `components/lesson/`     : Komponen lesson utama

---

## 9. Diagram Sederhana

```
sequenceDiagram
  participant User
  participant Next.js (Frontend)
  participant API Route
  participant Supabase
  participant Gemini AI
  participant YouTube API

  User->>Next.js (Frontend): Login/Register
  Next.js (Frontend)->>Supabase: Auth
  User->>Next.js (Frontend): Buat Outline
  Next.js (Frontend)->>Gemini AI: Generate Outline
  Next.js (Frontend)->>Supabase: Simpan Outline
  User->>Next.js (Frontend): Generate Course
  Next.js (Frontend)->>Gemini AI: Generate Lesson
  Next.js (Frontend)->>Supabase: Simpan Lesson
  User->>Next.js (Frontend): Buka Lesson
  Next.js (Frontend)->>YouTube API: Cari Video
  Next.js (Frontend)->>Supabase: Ambil Konten
  User->>Next.js (Frontend): Tanya Asisten
  Next.js (Frontend)->>Gemini AI: Jawab Pertanyaan
  Next.js (Frontend)->>Supabase: Simpan Riwayat Chat
```

---

> **Catatan:**
> - Proyek ini sangat modular, mudah dikembangkan untuk fitur AI/edukasi lain.
> - Untuk detail API eksternal, cek file `YOUTUBE_API_SETUP.md` dan kode di `lib/`. 