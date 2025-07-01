"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, CheckCircle, TrendingUp, Play } from "lucide-react"

const statsData = [
  {
    title: "Total Courses",
    value: "5",
    subtitle: "Enrolled courses",
    icon: BookOpen,
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "In Progress",
    value: "1",
    subtitle: "Active learning",
    icon: Clock,
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Completed",
    value: "0",
    subtitle: "Finished courses",
    icon: CheckCircle,
    color: "bg-green-100 text-green-600",
  },
  {
    title: "Avg Progress",
    value: "8%",
    subtitle: "Across all courses",
    icon: TrendingUp,
    color: "bg-pink-100 text-pink-600",
  },
]

const recentActivity = [
  {
    title: "Machine Learning Fundamentals",
    timeAgo: "18 hours ago",
    progress: 42,
  },
  {
    title: "React Development Mastery",
    timeAgo: "20 hours ago",
    progress: 0,
  },
  {
    title: "Data Science with Python",
    timeAgo: "20 hours ago",
    progress: 0,
  },
]

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome Back</h1>
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
          {recentActivity.map((activity, index) => (
            <Card key={index} className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-muted rounded-lg border border-border flex items-center justify-center">
                      <Play className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{activity.title}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm text-muted-foreground">{activity.timeAgo}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={activity.progress} className="w-32 h-2" />
                          <span className="text-sm font-medium text-foreground">{activity.progress}%</span>
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
                        // Navigate to course based on activity
                        const courseId = index === 0 ? "1" : index === 1 ? "2" : "3"
                        window.location.href = `/dashboard/course/${courseId}`
                      }}
                    >
                      Continue
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="hover:bg-muted hover:text-foreground"
                      onClick={() => {
                        // Mark as completed or remove from recent activity
                        const updatedActivity = recentActivity.filter((_, i) => i !== index)
                        // In a real app, this would update the state
                        alert(`Marked "${activity.title}" as completed!`)
                      }}
                    >
                      ✓
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 p-6 bg-card rounded-lg border border-border shadow-sm">
          <h3 className="font-medium text-foreground mb-3">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
              onClick={() => (window.location.href = "/dashboard/outline")}
            >
              Create New Course
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
              onClick={() => (window.location.href = "/dashboard/course")}
            >
              Browse All Courses
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-border text-foreground hover:bg-accent hover:text-accent-foreground hover:border-primary/50"
              onClick={() => {
                // Show study reminder
                alert("Study reminder set for tomorrow at 9:00 AM!")
              }}
            >
              Set Study Reminder
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
