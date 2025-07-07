"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, CheckCircle, TrendingUp, Play } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    avgProgress: 0,
  })
  const [userName, setUserName] = useState<string>("")
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    // Fetch user display name from Supabase
    const fetchUserName = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setUserName("");
        return;
      }
      const userId = session.user.id;
      // Adjust table/field if your profile table or field is different
      const { data: profile, error } = await supabase
        .from("profile")
        .select("full_name")
        .eq("id", userId)
        .single();
      if (profile && profile.full_name) {
        setUserName(profile.full_name);
      } else {
        setUserName(session.user.email || "User");
      }
    };
    fetchUserName();

    // Ambil data kursus dari localStorage
    const courses = JSON.parse(localStorage.getItem("generatedCourses") || "[]")
    const total = Array.isArray(courses) ? courses.length : 0
    const completed = Array.isArray(courses) ? courses.filter((c: any) => (c.progress ?? 0) >= 100).length : 0
    const inProgress = Array.isArray(courses) ? courses.filter((c: any) => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100).length : 0
    const avgProgress = total > 0 ? Math.round(courses.reduce((sum: number, c: any) => sum + (c.progress ?? 0), 0) / total) : 0

    setStats({
      total,
      inProgress,
      completed,
      avgProgress,
    })

    // Ambil recent activity dari localStorage
    const recent = JSON.parse(localStorage.getItem("recentCourses") || "[]")
    // Ambil data kursus dari generatedCourses untuk info progress
    const merged = recent.map((item: any) => {
      const course = courses.find((c: any) => c.id === item.courseId || c.courseId === item.courseId)
      return {
        ...item,
        progress: course?.progress ?? 0,
      }
    }).filter((item: any) => item.progress > 0)
    setRecentActivity(merged)
  }, [])

  if (!isMounted) return null

  const statsData = [
    { title: "Total Courses", value: stats.total, subtitle: "Enrolled courses", icon: BookOpen, color: "bg-blue-100 text-blue-600" },
    { title: "In Progress", value: stats.inProgress, subtitle: "Active learning", icon: Clock, color: "bg-purple-100 text-purple-600" },
    { title: "Completed", value: stats.completed, subtitle: "Finished courses", icon: CheckCircle, color: "bg-green-100 text-green-600" },
    { title: "Avg Progress", value: `${stats.avgProgress}%`, subtitle: "Across all courses", icon: TrendingUp, color: "bg-pink-100 text-pink-600" },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome Back{userName ? `, ${userName}` : ""}</h1>
        <p className="text-muted-foreground mt-1">Continue your learning journey</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <Card key={index} className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg border border-border/50 ${stat.color}`}>
                <stat.icon className="h-4 w-4 text-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center gap-2 mb-6 text-foreground">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </div>
        <p className="text-muted-foreground mb-6">Your latest learning progress and activities</p>

        <div className="space-y-4">
          {Array.isArray(recentActivity) && recentActivity.length === 0 ? (
            <div className="text-muted-foreground">No recent activity found.</div>
          ) : (
            recentActivity.map((activity, index) => (
              <Card key={index} className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-lg border border-border flex items-center justify-center">
                        <Play className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{activity.courseTitle}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-muted-foreground">{activity.lastViewedLessonTitle || activity.timeAgo}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={activity.progress} className="w-32 h-2" />
                            <span className="text-sm font-medium text-foreground">
                              {typeof activity.progress === 'number' ? activity.progress.toFixed(2) : activity.progress}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-border hover:border-primary/50"
                        onClick={() => {
                          router.push(`/dashboard/course/${activity.courseId}/learn/${activity.lastViewedLessonId || ""}`)
                        }}
                      >
                        Continue
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="hover:bg-muted hover:text-foreground"
                        onClick={() => {
                          // Hapus dari recent activity
                          const updated = recentActivity.filter((_, i) => i !== index)
                          setRecentActivity(updated)
                          localStorage.setItem("recentCourses", JSON.stringify(updated))
                        }}
                      >
                        ✓
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
