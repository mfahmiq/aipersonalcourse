// YouTube API utility functions
export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  embedUrl: string;
}

export interface YouTubeSearchResponse {
  items: YouTubeVideo[];
  nextPageToken?: string;
  totalResults: number;
}

// Fallback topics for general education videos
const POPULAR_EDU_VIDEO_IDS = [
  // CrashCourse: What is Computer Science?
  "tpIctyqH29Q",
  // TED-Ed: How computers predict the future
  "Q1HnL9bA5Gg",
  // Kurzgesagt: The History & Future of Everything
  "xVQxvth2rAc"
]

// Try multiple queries to always get a relevant video
export async function searchYouTubeVideos(
  lessonTitle: string,
  lessonContent: string,
  courseTitle?: string,
  maxResults: number = 1
): Promise<YouTubeVideo[]> {
  // Efficient: always combine courseTitle and lessonTitle, use only two queries
  const base = courseTitle
    ? `${courseTitle} ${lessonTitle}`
    : lessonTitle;

  const queries = [
    `${base} tutorial`,
    `${base} introduction`,
  ];

  for (const query of queries) {
    try {
      const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}&maxResults=${maxResults}`)
      if (!response.ok) {
        continue
      }
      const data = await response.json()
      if (data.items && data.items.length > 0) {
        return data.items
      }
    } catch (err) {
    }
  }

  // Fallback: show a popular education video
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

// Generate search query based on lesson content and course topic
export function generateVideoSearchQuery(lessonTitle: string, lessonContent: string, courseTopic?: string): string {
  // Extract key terms from lesson title and content
  const titleWords = lessonTitle.split(' ').filter(word => word.length > 3);
  const contentWords = lessonContent
    .split(' ')
    .filter(word => word.length > 4)
    .slice(0, 10); // Take first 10 longer words
  const topicWords = courseTopic ? courseTopic.split(' ').filter(word => word.length > 3) : [];

  // Combine title, topic, and content words, prioritize title and topic
  const searchTerms = [...titleWords, ...topicWords, ...contentWords].slice(0, 6);

  // Add educational context
  const educationalTerms = ['tutorial', 'learn', 'education', 'course'];
  const query = [...searchTerms, ...educationalTerms.slice(0, 2)].join(' ');

  return query;
} 