"use client"

import { useState, useEffect } from "react"
import { PlayCircle, Loader2, AlertCircle } from "lucide-react"
import { searchYouTubeVideos } from "@/lib/youtube"

interface YouTubePlayerProps {
  lessonTitle: string
  lessonContent: string
  courseTopic?: string
}

export function YouTubePlayer({ lessonTitle, lessonContent, courseTopic }: YouTubePlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVideo = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const videos = await searchYouTubeVideos(lessonTitle, lessonContent, courseTopic, 1)
        if (videos.length > 0) {
          setVideoUrl(videos[0].embedUrl)
        } else {
          setError("Tidak ada video yang ditemukan untuk topik ini")
        }
      } catch (err) {
        console.error("Error fetching video:", err)
        setError("Gagal memuat video")
      } finally {
        setLoading(false)
      }
    }

    fetchVideo()
  }, [lessonTitle, lessonContent, courseTopic])

  if (loading) {
    return (
      <div className="bg-muted rounded-lg aspect-video flex items-center justify-center mb-8 overflow-hidden">
        <div className="text-center text-muted-foreground">
          <div className="mb-4">
            <Loader2 className="h-16 w-16 mx-auto opacity-50 animate-spin" />
          </div>
          <h3 className="text-xl font-medium">Memuat Video...</h3>
          <p className="text-muted-foreground mt-2">Mencari video yang relevan</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-muted rounded-lg aspect-video flex items-center justify-center mb-8 overflow-hidden">
        <div className="text-center text-muted-foreground">
          <div className="mb-4">
            <AlertCircle className="h-16 w-16 mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-medium">Video Tidak Tersedia</h3>
          <p className="text-muted-foreground mt-2">{error}</p>
        </div>
      </div>
    )
  }

  if (videoUrl) {
    return (
      <div className="bg-muted rounded-lg aspect-video mb-8 overflow-hidden">
        <iframe
          src={videoUrl}
          title={lessonTitle}
          className="w-full h-full"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  // Fallback - should not reach here
  return (
    <div className="bg-muted rounded-lg aspect-video flex items-center justify-center mb-8 overflow-hidden">
      <div className="text-center text-muted-foreground">
        <div className="mb-4">
          <PlayCircle className="h-16 w-16 mx-auto opacity-50" />
        </div>
        <h3 className="text-xl font-medium">Video Player</h3>
        <p className="text-muted-foreground mt-2">Click play to start the lesson</p>
      </div>
    </div>
  )
} 