"use client"

import { useState, useEffect } from "react"
import { PlayCircle, Loader2, AlertCircle } from "lucide-react"
import { searchYouTubeVideos } from "@/lib/youtube"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface YouTubePlayerProps {
  videoUrl?: string
  lessonTitle: string
  lessonContent: string
  courseTopic?: string
  courseId?: string
  chapterId?: string
}

export function YouTubePlayer({ videoUrl: initialVideoUrl, lessonTitle, lessonContent, courseTopic, courseId, chapterId }: YouTubePlayerProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideoUrl || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (initialVideoUrl) {
      setVideoUrl(initialVideoUrl)
      setLoading(false)
      setError(null)
      return
    }
    const fetchVideo = async () => {
      setLoading(true)
      setError(null)
      try {
        const videos = await searchYouTubeVideos(lessonTitle, lessonContent, courseTopic, 1)
        if (videos.length > 0) {
          setVideoUrl(videos[0].embedUrl)
          // Update video_url in Supabase if courseId and chapterId are provided
          if (courseId && chapterId) {
            const { error } = await supabase
              .from("course_chapters")
              .update({ video_url: videos[0].embedUrl })
              .eq("course_id", courseId)
              .eq("id", chapterId)
            if (error) {
            } else {
            }
          } else {
          }
        } else {
          setError("Tidak ada video yang ditemukan untuk topik ini")
        }
      } catch (err) {
        setError("Gagal memuat video")
      } finally {
        setLoading(false)
      }
    }
    fetchVideo()
  }, [initialVideoUrl, lessonTitle, lessonContent, courseTopic, courseId, chapterId])

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