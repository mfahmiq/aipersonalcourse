/**
 * YouTube API utility functions
 * File ini berisi fungsi-fungsi untuk mencari dan mengelola video YouTube
 * yang relevan dengan konten pembelajaran
 */

// Interface untuk data video YouTube
export interface YouTubeVideo {
  id: string;              // ID unik video YouTube
  title: string;           // Judul video
  description: string;     // Deskripsi video
  thumbnail: string;       // URL thumbnail video
  channelTitle: string;    // Nama channel YouTube
  publishedAt: string;     // Tanggal publikasi
  duration: string;        // Durasi video
  viewCount: string;       // Jumlah views
  embedUrl: string;        // URL untuk embed video
}

// Interface untuk response pencarian YouTube
export interface YouTubeSearchResponse {
  items: YouTubeVideo[];           // Array video yang ditemukan
  nextPageToken?: string;          // Token untuk halaman berikutnya
  totalResults: number;            // Total hasil pencarian
}

// Video pendidikan populer sebagai fallback jika pencarian gagal
const POPULAR_EDU_VIDEO_IDS = [
  // CrashCourse: What is Computer Science?
  "tpIctyqH29Q",
  // TED-Ed: How computers predict the future
  "Q1HnL9bA5Gg",
  // Kurzgesagt: The History & Future of Everything
  "xVQxvth2rAc"
]

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
  const base = courseTitle
    ? `${courseTitle} ${lessonTitle}`
    : lessonTitle;

  // Array query yang akan dicoba secara berurutan
  const queries = [
    `${base} tutorial`,      // Mencari tutorial
    `${base} introduction`,  // Mencari pengenalan
  ];

  // Mencoba setiap query sampai menemukan hasil
  for (const query of queries) {
    try {
      
      // Memanggil API YouTube search
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`)
      
      if (!response.ok) {
        continue // Coba query berikutnya
      }
      
      const data = await response.json()
      
      // Jika ada hasil, kembalikan video yang ditemukan
      if (data.items && data.items.length > 0) {
        return data.items
      }
    } catch (err) {
    }
  }

  // Fallback: mengembalikan video pendidikan populer jika pencarian gagal
  return POPULAR_EDU_VIDEO_IDS.map((id) => ({
    id,
    title: "Educational Video",
    description: "General education video fallback.",
    thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    channelTitle: "YouTube Education",
    publishedAt: "",
    duration: "",
    viewCount: "",
    embedUrl: `https://www.youtube.com/embed/${id}`
  }))
}

/**
 * Menghasilkan query pencarian berdasarkan konten pelajaran dan topik kursus
 * 
 * @param lessonTitle - Judul pelajaran
 * @param lessonContent - Konten pelajaran
 * @param courseTopic - Topik kursus (opsional)
 * @returns String query untuk pencarian YouTube
 */
export function generateVideoSearchQuery(lessonTitle: string, lessonContent: string, courseTopic?: string): string {
  // Mengekstrak kata-kata penting dari judul pelajaran
  const titleWords = lessonTitle.split(' ').filter(word => word.length > 3);
  
  // Mengekstrak kata-kata penting dari konten (10 kata terpanjang pertama)
  const contentWords = lessonContent
    .split(' ')
    .filter(word => word.length > 4)
    .slice(0, 10);
  
  // Mengekstrak kata-kata dari topik kursus
  const topicWords = courseTopic ? courseTopic.split(' ').filter(word => word.length > 3) : [];

  // Menggabungkan kata-kata dari judul, topik, dan konten (prioritas: judul > topik > konten)
  const searchTerms = [...titleWords, ...topicWords, ...contentWords].slice(0, 6);

  // Menambahkan konteks pendidikan
  const educationalTerms = ['tutorial', 'learn', 'education', 'course'];
  const query = [...searchTerms, ...educationalTerms.slice(0, 2)].join(' ');

  return query;
} 