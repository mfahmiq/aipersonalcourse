/**
 * Dashboard Page Component
 * Halaman utama dashboard user untuk menampilkan statistik kursus dan aktivitas terbaru
 * Menyediakan ringkasan progres belajar dan daftar aktivitas kursus terakhir
 */

"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, CheckCircle, TrendingUp, Play } from "lucide-react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

/**
 * Dashboard Component
 * Komponen utama dashboard user
 * Menampilkan statistik kursus, progres, dan aktivitas terbaru
 *
 * @returns JSX element untuk halaman dashboard
 */
export default function Dashboard() {
  const router = useRouter();
  const supabase = createClientComponentClient();
  // State statistik kursus
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    avgProgress: 0,
  })
  // State nama user
  const [userName, setUserName] = useState<string>("")
  // State aktivitas terbaru
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true);
  const [notLoggedIn, setNotLoggedIn] = useState(false);

  /**
   * Fetch data statistik, nama user, dan aktivitas terbaru saat mount
   */
  useEffect(() => {
    setIsMounted(true)

    /**
     * Fetch nama user dari tabel settings
     */
    const fetchUserName = async (userId: string) => {
      // Fetch from settings table instead of profile
      const { data: settings, error } = await supabase
        .from("settings")
        .select("full_name")
        .eq("id", userId)
        .single();
      if (settings && settings.full_name) {
        setUserName(settings.full_name);
      } else {
        setUserName("");
      }
    };

    /**
     * Fetch statistik kursus user
     */
    const fetchStats = async (userId: string) => {
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", userId);

      if (coursesError) {
        return;
      }

      const total = courses.length;
      const completed = courses.filter((c: any) => (c.progress ?? 0) >= 100).length;
      const inProgress = courses.filter((c: any) => (c.progress ?? 0) > 0 && (c.progress ?? 0) < 100).length;
      const avgProgress = total > 0 ? Math.round(courses.reduce((sum: number, c: any) => sum + (c.progress ?? 0), 0) / total) : 0;

      setStats({
        total,
        inProgress,
        completed,
        avgProgress,
      });
    };

    /**
     * Fetch aktivitas terbaru user dari tabel courses
     */
    const fetchRecentActivity = async (userId: string) => {
      const { data: courses, error } = await supabase
        .from("courses")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) {
        setRecentActivity([]);
        return;
      }
      setRecentActivity(courses || []);
    };

    /**
     * Fetch semua data user (nama, stats, aktivitas)
     */
    const fetchAll = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session || !session.user?.id) {
        setNotLoggedIn(true);
        setLoading(false);
        // Optional: Uncomment to redirect
        // router.push("/login");
        return;
      }
      const userId = session.user.id;
      await fetchUserName(userId);
      await fetchStats(userId);
      await fetchRecentActivity(userId);
      setLoading(false);
    };

    fetchAll();
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }
  if (notLoggedIn) {
    return <div className="flex justify-center items-center h-64 text-red-500">Please login to view your dashboard.</div>;
  }

  if (!isMounted) return null

  // Data statistik untuk cards
  const statsData = [
    { title: "Total Kursus", value: stats.total, subtitle: "Kursus yang diikuti", icon: BookOpen, color: "bg-blue-100 text-blue-600" },
    { title: "Sedang Berjalan", value: stats.inProgress, subtitle: "Belajar aktif", icon: Clock, color: "bg-purple-100 text-purple-600" },
    { title: "Selesai", value: stats.completed, subtitle: "Kursus selesai", icon: CheckCircle, color: "bg-green-100 text-green-600" },
    { title: "Rata-rata Progres", value: `${stats.avgProgress}%`, subtitle: "Dari semua kursus", icon: TrendingUp, color: "bg-pink-100 text-pink-600" },
  ]

  // Filter aktivitas terbaru hanya untuk kursus yang sudah ada progres
  const filteredRecentActivity = Array.isArray(recentActivity)
    ? recentActivity.filter((course) => (course.progress ?? 0) > 0)
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Selamat Datang Kembali{userName ? `, ${userName}` : ""}</h1>
        <p className="text-muted-foreground mt-1">Lanjutkan perjalanan belajar Anda</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => (
          <Card key={index} className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg border border-border/50 ${stat.color}`}>
                <stat.icon className="h-4 w-4 text-foreground dark:text-black" />
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
          <h2 className="text-xl font-semibold">Aktivitas Terbaru</h2>
        </div>
        <p className="text-muted-foreground mb-6">Progres dan aktivitas belajar terbaru Anda</p>

        <div className="space-y-4">
          {filteredRecentActivity.length === 0 ? (
            <div className="text-muted-foreground">Tidak ada aktivitas terbaru.</div>
          ) : (
            filteredRecentActivity.map((course, index) => (
              <Card key={course.id || index} className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-14 bg-muted rounded-lg border border-border flex items-center justify-center overflow-hidden">
                        <img
                          src={course.image || "/placeholder.svg"}
                          alt={course.title}
                          className="object-cover w-full h-full"
                          loading="lazy"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{course.title}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="text-sm text-muted-foreground">Last updated: {course.updated_at ? new Date(course.updated_at).toLocaleString() : '-'}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={Math.min(course.progress, 100)} className="w-32 h-2" />
                            <span className="text-sm font-medium text-foreground">
                              {typeof course.progress === 'number' ? Math.min(course.progress, 100).toFixed(2) : course.progress}%
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
                        onClick={async () => {
                          if (course.type === "generated") {
                            // Fetch the first lesson's real ID from Supabase
                            const { data: firstLesson, error } = await supabase
                              .from("course_chapters")
                              .select("id")
                              .eq("course_id", course.id)
                              .order("id", { ascending: true })
                              .limit(1)
                              .single();
                            if (error || !firstLesson) {
                              alert("Tidak dapat menemukan lesson pertama untuk course ini.");
                              return;
                            }
                            router.push(`/dashboard/course/${course.id}/learn/${firstLesson.id}`);
                          } else {
                            router.push(`/dashboard/course/${course.id}`);
                          }
                        }}
                      >
                        {course.progress === 100 ? "Tinjau" : "Lanjutkan"}
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
