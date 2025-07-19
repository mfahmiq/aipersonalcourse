# Panduan Komentar - AI Personal Course

## Overview
Dokumen ini menjelaskan standar dan pola komentar yang telah diterapkan di seluruh proyek AI Personal Course untuk memudahkan pemahaman kode.

## Jenis Komentar yang Digunakan

### 1. File Header Comments
Setiap file dimulai dengan komentar header yang menjelaskan:
- Nama dan tujuan file
- Teknologi yang digunakan
- Tanggung jawab utama file

```typescript
/**
 * File Name Component
 * Deskripsi singkat tentang fungsi file
 * Teknologi atau library yang digunakan
 */
```

### 2. Function/Component Comments
Setiap fungsi atau komponen memiliki komentar JSDoc yang menjelaskan:
- Tujuan fungsi/komponen
- Parameter yang diterima
- Return value
- Contoh penggunaan (jika diperlukan)

```typescript
/**
 * Function Name
 * Deskripsi detail tentang apa yang dilakukan fungsi ini
 * 
 * @param param1 - Deskripsi parameter pertama
 * @param param2 - Deskripsi parameter kedua
 * @returns Deskripsi nilai yang dikembalikan
 * 
 * @example
 * const result = functionName(value1, value2);
 */
```

### 3. Inline Comments
Komentar singkat di dalam kode untuk menjelaskan:
- Logika bisnis yang kompleks
- Alasan penggunaan teknik tertentu
- Workaround atau solusi sementara

```typescript
// Komentar singkat untuk menjelaskan baris kode
const result = complexCalculation(); // Menghasilkan nilai yang dibutuhkan untuk proses selanjutnya
```

### 4. Section Comments
Komentar untuk mengelompokkan bagian-bagian kode yang berhubungan:

```typescript
// State Management
const [state, setState] = useState();

// Event Handlers
const handleClick = () => {};

// Render Logic
return (
  <div>
    {/* Component content */}
  </div>
);
```

## Pola Komentar yang Diterapkan

### Konfigurasi Files
```typescript
/**
 * Konfigurasi Next.js untuk aplikasi AI Course Generator
 * File ini berisi pengaturan untuk build, linting, dan optimasi gambar
 */
```

### API Routes
```typescript
/**
 * API Route Handler
 * Endpoint untuk operasi tertentu
 * 
 * @param request - Request object
 * @returns Response dengan data atau error
 */
```

### React Components
```typescript
/**
 * Component Name
 * Component ini menampilkan [deskripsi fungsi]
 * 
 * @param prop1 - Deskripsi prop pertama
 * @param prop2 - Deskripsi prop kedua
 * @returns JSX element
 */
```

### Utility Functions
```typescript
/**
 * Function Name
 * Fungsi utility untuk [tujuan]
 * 
 * @param input - Input yang diproses
 * @returns Hasil pemrosesan
 */
```

### Type Definitions
```typescript
/**
 * Interface untuk [nama data structure]
 * Mendefinisikan struktur data untuk [tujuan]
 */
export interface InterfaceName {
  property1: string;    // Deskripsi property
  property2: number;    // Deskripsi property
}
```

## Contoh Implementasi

### File Konfigurasi
```typescript
/**
 * Middleware untuk autentikasi dan proteksi rute
 * File ini menangani redirect otomatis berdasarkan status login user
 */

import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

/**
 * Middleware function yang dijalankan sebelum setiap request
 * @param req - Request object dari Next.js
 * @returns Response object atau redirect
 */
export async function middleware(req: NextRequest) {
  // Membuat response default
  const res = NextResponse.next()
  
  // Membuat client Supabase untuk middleware
  const supabase = createMiddlewareClient({ req, res })

  // Mengambil session user dari Supabase
  const { data: { session } } = await supabase.auth.getSession()

  // Jika user tidak login dan mencoba mengakses rute yang dilindungi
  if (!session && !["/", "/login", "/register"].includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return res
}
```

### React Component
```typescript
/**
 * Login Page Component
 * Halaman login untuk aplikasi AI Personal Course
 * Menyediakan form autentikasi dengan Supabase Auth
 */

export default function LoginPage() {
  // Router untuk navigasi setelah login berhasil
  const router = useRouter()
  
  // State untuk form inputs
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  
  /**
   * Handler untuk submit form login
   * Melakukan autentikasi dengan Supabase dan menyimpan data user ke settings
   * 
   * @param e - Form event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    // Implementation
  }

  return (
    <div>
      {/* Form container */}
      <form onSubmit={handleSubmit}>
        {/* Email input */}
        <input type="email" />
        
        {/* Password input */}
        <input type="password" />
        
        {/* Submit button */}
        <button type="submit">Login</button>
      </form>
    </div>
  )
}
```

### Utility Function
```typescript
/**
 * YouTube API utility functions
 * File ini berisi fungsi-fungsi untuk mencari dan mengelola video YouTube
 * yang relevan dengan konten pembelajaran
 */

/**
 * Mencari video YouTube yang relevan dengan konten pembelajaran
 * 
 * @param lessonTitle - Judul pelajaran
 * @param lessonContent - Konten pelajaran
 * @param courseTitle - Judul kursus (opsional)
 * @param maxResults - Jumlah maksimal hasil (default: 1)
 * @returns Promise array of YouTubeVideo
 */
export async function searchYouTubeVideos(
  lessonTitle: string,
  lessonContent: string,
  courseTitle?: string,
  maxResults: number = 1
): Promise<YouTubeVideo[]> {
  // Membuat query dasar dengan menggabungkan judul kursus dan pelajaran
  const base = courseTitle ? `${courseTitle} ${lessonTitle}` : lessonTitle;

  // Array query yang akan dicoba secara berurutan
  const queries = [
    `${base} tutorial`,      // Mencari tutorial
    `${base} introduction`,  // Mencari pengenalan
  ];

  // Mencoba setiap query sampai menemukan hasil
  for (const query of queries) {
    // Implementation
  }
}
```

## Best Practices

### 1. Konsistensi
- Gunakan format yang sama untuk semua komentar
- Jangan campur bahasa Indonesia dan Inggris dalam satu file
- Gunakan terminologi yang konsisten

### 2. Kejelasan
- Jelaskan "mengapa" bukan hanya "apa"
- Gunakan bahasa yang mudah dipahami
- Hindari komentar yang terlalu teknis tanpa konteks

### 3. Maintenance
- Update komentar ketika kode berubah
- Hapus komentar yang tidak relevan
- Pastikan komentar tetap akurat

### 4. Struktur
- Mulai dengan overview file
- Kelompokkan fungsi-fungsi yang berhubungan
- Gunakan section comments untuk organisasi

## File yang Telah Dikomentari

### Konfigurasi
- ✅ `next.config.mjs`
- ✅ `middleware.ts`
- ✅ `tsconfig.json`

### Utilities
- ✅ `lib/supabase.ts`
- ✅ `lib/utils.ts`
- ✅ `lib/youtube.ts`
- ✅ `lib/utils/gemini.ts`
- ✅ `lib/utils/prompts.ts`
- ✅ `lib/utils/lessonParser.ts`
- ✅ `lib/utils/lessonTypes.ts`

### Pages & Components
- ✅ `app/layout.tsx`
- ✅ `app/page.tsx`
- ✅ `app/login/page.tsx`
- ✅ `app/register/page.tsx`
- ✅ `app/dashboard/layout.tsx`
- ✅ `app/auth/callback/route.ts`
- ✅ `app/api/youtube/search/route.ts`
- ✅ `app/api/lesson/insert/route.ts`
- ✅ `components/theme-provider.tsx`
- ✅ `components/theme-toggle.tsx`
- ✅ `components/ui/button.tsx`
- ✅ `components/ui/input.tsx`
- ✅ `components/ui/card.tsx`
- ✅ `components/lesson/LessonAssistant.tsx`

### Dokumentasi
- ✅ `PROJECT_STRUCTURE.md`
- ✅ `COMMENTING_GUIDE.md`

## Manfaat Komentar

### 1. Onboarding
- Developer baru dapat memahami kode dengan cepat
- Mengurangi waktu untuk memahami arsitektur
- Memudahkan debugging dan troubleshooting

### 2. Maintenance
- Memudahkan refactoring dan perubahan kode
- Mengurangi kemungkinan bug saat modifikasi
- Dokumentasi yang selalu up-to-date

### 3. Collaboration
- Tim dapat bekerja lebih efisien
- Mengurangi pertanyaan tentang implementasi
- Standar kode yang konsisten

### 4. Quality Assurance
- Code review yang lebih efektif
- Testing yang lebih terarah
- Dokumentasi untuk deployment

---

*Panduan ini akan terus diperbarui seiring dengan perkembangan proyek dan feedback dari tim.* 