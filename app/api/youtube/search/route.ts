import { NextRequest, NextResponse } from 'next/server'

// Tambahkan cache di luar handler
const cache = new Map<string, { data: any, expires: number }>()
const CACHE_TTL = 10 * 60 * 1000 // 10 menit dalam ms

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const maxResults = searchParams.get('maxResults') || '5'

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    // Key cache berdasarkan query dan maxResults
    const cacheKey = `${query}:${maxResults}`
    const now = Date.now()
    const cached = cache.get(cacheKey)
    if (cached && cached.expires > now) {
      return NextResponse.json({ items: cached.data })
    }

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'YouTube API key not configured' }, { status: 500 })
    }

    // First, search for videos
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${apiKey}`
    
    const searchResponse = await fetch(searchUrl)
    if (!searchResponse.ok) {
      throw new Error(`YouTube search API error: ${searchResponse.status}`)
    }
    
    const searchData = await searchResponse.json()
    
    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ items: [] })
    }

    // Get video IDs for detailed information
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
    
    // Get detailed video information including duration and statistics
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${apiKey}`
    
    const detailsResponse = await fetch(detailsUrl)
    if (!detailsResponse.ok) {
      throw new Error(`YouTube details API error: ${detailsResponse.status}`)
    }
    
    const detailsData = await detailsResponse.json()
    
    // Format duration from ISO 8601 format to readable format
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

    // Format view count with K, M, B suffixes
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
    
    // Combine search and details data
    const videos = detailsData.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      duration: formatDuration(item.contentDetails.duration),
      viewCount: formatViewCount(item.statistics.viewCount),
      embedUrl: `https://www.youtube.com/embed/${item.id}`
    }))

    // Simpan ke cache
    cache.set(cacheKey, { data: videos, expires: now + CACHE_TTL })

    return NextResponse.json({ items: videos })
  } catch (error) {
    console.error('YouTube API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch YouTube videos' }, 
      { status: 500 }
    )
  }
} 