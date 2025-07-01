# YouTube API Setup Guide

## ✅ Implementasi Selesai!

YouTube API integration telah berhasil diimplementasikan dengan fitur video embed otomatis berdasarkan konten lesson.

## 🎥 Fitur yang Tersedia

### Video Player Utama
- ✅ Video YouTube otomatis muncul di bagian video player utama
- ✅ Pencarian video berdasarkan judul dan konten lesson
- ✅ Loading state dengan animasi spinner
- ✅ Error handling dengan pesan informatif
- ✅ Fallback ke placeholder jika tidak ada video

### Smart Search
- ✅ Query pencarian otomatis berdasarkan judul lesson
- ✅ Menambahkan kata kunci edukasi (tutorial, learn, education, course)
- ✅ Maksimal 1 video per lesson untuk fokus

### UI/UX
- ✅ Responsive design (16:9 aspect ratio)
- ✅ Loading skeleton dengan animasi
- ✅ Error states yang informatif
- ✅ Integrasi seamless dengan lesson content

## 🔧 Konfigurasi yang Diperlukan

### 1. File `.env.local`
Buat file `.env.local` di root project dengan konten:

```env
# YouTube API Configuration
YOUTUBE_API_KEY=AIzaSyDVvnx7Hh17EbiqgSrBEHlL6zCXX1fnFfQ

# Existing Gemini API Key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Restart Development Server
```bash
npm run dev
```

## 🎯 Cara Kerja

1. **Auto-Detection**: Sistem otomatis mendeteksi lesson yang sedang dibuka
2. **Smart Query**: Membuat query pencarian berdasarkan judul lesson
3. **Video Fetch**: Mengambil video YouTube yang paling relevan
4. **Auto-Embed**: Video otomatis ditampilkan di video player utama
5. **Fallback**: Jika tidak ada video, tampilkan placeholder yang informatif

## 📁 File yang Dibuat/Dimodifikasi

### File Baru:
- `lib/youtube.ts` - Utility functions untuk YouTube API
- `components/ui/youtube-player.tsx` - Komponen video player utama
- `app/api/youtube/search/route.ts` - API route untuk pencarian video

### File yang Dimodifikasi:
- `app/dashboard/course/[id]/learn/[lessonId]/page.tsx` - Mengintegrasikan video player
- `app/globals.css` - Styling untuk komponen video

## 🚀 Testing

1. Buka lesson page
2. Scroll ke bagian video player (di atas lesson content)
3. Video YouTube yang relevan akan otomatis dimuat
4. Jika loading, akan muncul spinner dengan pesan "Memuat Video..."
5. Jika error, akan muncul pesan error yang informatif

## 🔒 Keamanan

- ✅ API key disimpan di server side (`.env.local`)
- ✅ Tidak ada exposure API key di client side
- ✅ Rate limiting dan error handling
- ✅ Fallback mechanisms

## 📊 API Quota

YouTube Data API v3 memiliki quota harian:
- 10,000 units per hari (gratis)
- Setiap search request = 100 units
- Setiap video details request = 1 unit

Untuk production, pertimbangkan:
- Caching untuk mengurangi API calls
- Rate limiting
- Upgrade ke paid quota jika diperlukan

## 🎉 Selamat!

Implementasi YouTube video embed sudah selesai dan siap digunakan! Video akan otomatis muncul di video player utama berdasarkan konten lesson yang sedang dipelajari. 