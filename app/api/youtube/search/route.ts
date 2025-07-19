/**
 * YouTube Search API Route
 * File ini menyediakan endpoint untuk mencari video YouTube
 * Menggunakan YouTube Data API v3 untuk mendapatkan video yang relevan
 */

import { NextRequest, NextResponse } from 'next/server'

// Cache untuk menyimpan hasil pencarian dan mengurangi API calls
const cache = new Map<string, { data: any, expires: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 menit dalam milliseconds

/**
 * GET handler untuk YouTube search API
 * Menerima query parameter dan mengembalikan video YouTube yang relevan
 * 
 * @param request - NextRequest object dengan search parameters
 * @returns JSON response dengan array video YouTube
 */
export async function GET(request: NextRequest) {
  try {
    // Mengambil parameter dari URL
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')                    // Query pencarian
    const maxResults = searchParams.get('maxResults') || '5' // Jumlah maksimal hasil

    // Validasi parameter query
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    // Cek cache terlebih dahulu untuk menghindari API calls yang tidak perlu
    const cacheKey = `${query}:${maxResults}`
    const now = Date.now()
    const cached = cache.get(cacheKey)
    if (cached && cached.expires > now) {
      return NextResponse.json({ items: cached.data })
    }

    // Validasi API key YouTube
    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })
    }

    // Step 1: Search untuk video berdasarkan query
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${apiKey}`
    
    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      throw new Error(`YouTube search API error: ${searchResponse.status}`)
    }
    
    const searchData = await searchResponse.json()
    
    // Jika tidak ada hasil, kembalikan array kosong
    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ items: [] })
    }

    // Step 2: Ambil video IDs untuk mendapatkan informasi detail
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
    
    // Step 3: Ambil informasi detail video termasuk durasi dan statistik
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`
    
    const detailsResponse = await fetch(detailsUrl)
    if (!detailsResponse.ok) {
      throw new Error(`YouTube details API error: ${detailsResponse.status}`)
    }
    
    const detailsData = await detailsResponse.json()
    
    /**
     * Format durasi dari format ISO 8601 ke format yang mudah dibaca
     * Contoh: PT1H2M30S -> 1:02:30
     * 
     * @param duration - String durasi dalam format ISO 8601
     * @returns String durasi yang sudah diformat
     */
    const formatDuration = (duration: string): string => {
      const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/)
      if (!match) return 'Unknown'
      
      const hours = (match[1] || '').replace('H', '')
      const minutes = (match[2] || '').replace('M', '')
      const seconds = (match[3] || '').replace('S', '')
      
      let result = ''
      if (hours) result += `${hours}:`
      if (minutes) result += `${minutes.padStart(2, '0')}:`
      else result += '00:'
      if (seconds) result += seconds.padStart(2, '0')
      else result += '00'
      
      return result
    }

    /**
     * Format view count dengan suffix K, M, B
     * Contoh: 1500000 -> 1.5M
     * 
     * @param viewCount - String jumlah views
     * @returns String view count yang sudah diformat
     */
    const formatViewCount = (viewCount: string): string => {
      const count = parseInt(viewCount)
      if (count >= 1000000000) {
        return `${(count / 1000000000).toFixed(1)}B`
      } else if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`
      } else if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`
      }
      return count.toString()
    }
    
    // Menggabungkan data search dan details menjadi format yang konsisten
    const videos = detailsData.items.map((item: any) => ({
      id: item.id,                                                    // Video ID
      title: item.snippet.title,                                      // Judul video
      description: item.snippet.description,                          // Deskripsi video
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url, // Thumbnail
      channelTitle: item.snippet.channelTitle,                        // Nama channel
      publishedAt: item.snippet.publishedAt,                          // Tanggal publikasi
      duration: formatDuration(item.contentDetails.duration),         // Durasi yang sudah diformat
      viewCount: formatViewCount(item.statistics.viewCount),          // View count yang sudah diformat
      embedUrl: `https://www.youtube.com/embed/${item.id}`            // URL untuk embed
    }))

    // Simpan hasil ke cache untuk penggunaan selanjutnya
    cache.set(cacheKey, { data: videos, expires: now + CACHE_TTL })

    return NextResponse.json({ items: videos })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch YouTube videos' }, 
      { status: 500 }
    )
  }
} 