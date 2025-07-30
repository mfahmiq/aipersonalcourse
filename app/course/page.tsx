"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BookOpen, Clock, Play, Search, Filter, Plus, Edit, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Tambahkan tipe Course agar nextLessonId dikenali
interface Kursus {
  id: string;
  judul: string;
  deskripsi: string;
  kemajuan: number;
  jumlahMateri: number;
  materiSelesai: number;
  durasi: string;
  tingkat: string;
  status: string;
  gambar: string;
  createdAt?: string;
  nextMateriId?: string;
}

export default function KursusPage() {
  const [kursus, setKursus] = useState<Kursus[]>([])
  const [pencarian, setPencarian] = useState("")
  const [filterTingkat, setFilterTingkat] = useState("semua")
  const [filterStatus, setFilterStatus] = useState("semua")
  const router = useRouter();
  const supabase = createClientComponentClient();

  // Load courses from Supabase
  useEffect(() => {
    const fetchKursus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user?.id) {
        setKursus([]);
        return;
      }
      const userId = session.user.id;
      const { data: kursusData, error } = await supabase
        .from("kursus")
        .select("*")
        .eq("pengguna_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching kursus:", error);
        setKursus([]);
        return;
      }

      const formattedKursus = (kursusData || []).map((item: any) => ({
        id: item.id,
        judul: item.judul,
        deskripsi: item.deskripsi,
        kemajuan: item.kemajuan ?? 0,
        jumlahMateri: item.jumlah_materi ?? 0,
        materiSelesai: Array.isArray(item.materi_selesai) ? item.materi_selesai.length : 0,
        durasi: item.durasi ?? "",
        tingkat: item.tingkat ?? "",
        status: item.kemajuan === 100 ? "Selesai" : item.kemajuan > 0 ? "Sedang Berjalan" : "Belum Dimulai",
        gambar: item.gambar || "/placeholder.svg?height=200&width=300",
        createdAt: item.created_at
      }));
      setKursus(formattedKursus);
    };
    fetchKursus();
  }, []);

  // Handle course deletion
  const handleHapusKursus = async (kursusId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kursus ini? Tindakan ini tidak dapat dibatalkan.")) {
      try {
        const { error: materiError } = await supabase
          .from("materi")
          .delete()
          .eq("kursus_id", kursusId);
        if (materiError) {
          console.error("Error deleting materi:", materiError);
        }
        const { error } = await supabase.from("kursus").delete().eq("id", kursusId);
      if (error) {
        alert("Gagal menghapus kursus: " + error.message);
        return;
      }
        setKursus(prev => prev.filter(k => k.id !== kursusId));
        alert("Kursus berhasil dihapus!");
      } catch (error) {
        alert("Terjadi kesalahan saat menghapus kursus: " + error);
      }
    }
  }

  const handleEditKursus = (kursusId: string) => {
            router.push(`/course/${kursusId}/edit`)
  }

  const kursusTersaring = kursus.filter((k) => {
    const cocokCari =
      k.judul.toLowerCase().includes(pencarian.toLowerCase()) ||
      k.deskripsi.toLowerCase().includes(pencarian.toLowerCase())
    const cocokTingkat = filterTingkat === "semua" || k.tingkat === filterTingkat
    const cocokStatus = filterStatus === "semua" || k.status === filterStatus
    return cocokCari && cocokTingkat && cocokStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Sedang Berjalan":
        return "bg-emerald-500 text-white"
      case "Selesai":
        return "bg-emerald-500 text-white"
      case "Belum Dimulai":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getTingkatColor = (tingkat: string) => {
    switch (tingkat) {
      case "Pemula":
        return "bg-blue-500 text-white"
      case "Menengah":
        return "bg-yellow-500 text-white"
      case "Lanjutan":
        return "bg-red-500 text-white"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div>
      {/* Peringatan AI-generated */}
      <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-6 rounded">
        <strong>Perhatian:</strong> Semua kursus di halaman ini digenerate menggunakan AI. Ada kemungkinan informasi yang diberikan mengandung halusinasi atau ketidakakuratan. <br />
        <span>Mohon selalu cek dan verifikasi fakta/informasi penting dari kursus ini sebelum digunakan lebih lanjut.</span>
      </div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Kursus Saya</h1>
          <p className="text-muted-foreground mt-1">Lanjutkan perjalanan belajar Anda dan kelola semua kursus di sini</p>
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20" asChild>
          <Link href="/outline">
            <Plus className="h-4 w-4 mr-2" />
            Buat Kursus Baru
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari kursus..."
                value={pencarian}
                onChange={(e) => setPencarian(e.target.value)}
                className="pl-10 bg-background border-border focus:border-primary focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px] border-border focus:border-primary">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="semua">Semua Status</SelectItem>
                  <SelectItem value="Belum Dimulai">Belum Dimulai</SelectItem>
                  <SelectItem value="Sedang Berjalan">Sedang Berjalan</SelectItem>
                  <SelectItem value="Selesai">Selesai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {kursusTersaring.map((k, index) => {
          const realId = k.id;
          const persen = k.jumlahMateri > 0 ? Math.round((k.materiSelesai / k.jumlahMateri) * 100) : 0;
          const displayPersen = Math.min(persen, 100);
          return (
            <Card key={`${realId}-${index}`} className="border border-border bg-card shadow-sm hover:shadow-md transition-shadow group">
            <div className="relative">
              <img
                  src={k.gambar || "/placeholder.svg"}
                  alt={k.judul}
                className="w-full h-48 object-cover rounded-t-lg"
              />
                <div className="absolute top-3 right-3 flex gap-2">
                  <Badge className={getStatusColor(k.status)}>
                    {k.status}
                  </Badge>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-6 w-6 p-0 bg-background/80 hover:bg-background"
                    onClick={() => handleEditKursus(realId)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-6 w-6 p-0 bg-destructive/80 hover:bg-destructive"
                    onClick={() => handleHapusKursus(realId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
              </div>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                  {k.tingkat && (
                    <Badge variant="outline" className={`border-border ${getTingkatColor(k.tingkat)}`}>{k.tingkat}</Badge>
                )}
                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                  <Clock className="h-4 w-4" />
                    <span>{k.durasi}</span>
                  </div>
                </div>
                <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">{k.judul}</CardTitle>
                <p className="text-muted-foreground text-sm line-clamp-2">{k.deskripsi}</p>
            </CardHeader>
            <CardContent className="space-y-4">
                {displayPersen > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-foreground">
                      <span>Progres</span>
                      <span>{displayPersen}%</span>
                  </div>
                    <Progress value={displayPersen} className="h-2" />
                  <div className="text-xs text-muted-foreground">
                      {k.materiSelesai} dari {k.jumlahMateri} materi selesai
                  </div>
                </div>
              )}
                {/* Tombol Aksi */}
                {k.kemajuan === 0 ? (
                  <Button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20"
                    onClick={async () => {
                      const { data: firstMateri, error } = await supabase
                        .from("materi")
                        .select("id")
                        .eq("kursus_id", realId)
                        .order("nomor_modul", { ascending: true })
                        .order("nomor_materi", { ascending: true })
                        .limit(1)
                        .single();
                      if (error || !firstMateri) {
                        alert("Tidak dapat menemukan materi pertama untuk kursus ini.");
                        return;
                      }
                      router.push(`/course/${realId}/learn/${firstMateri.id}`);
                    }}
                  >
                    Mulai Kursus
                  </Button>
                ) : k.kemajuan < 100 ? (
                  <Button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20"
                    onClick={async () => {
                      const { data: firstMateri, error } = await supabase
                        .from("materi")
                        .select("id")
                        .eq("kursus_id", realId)
                        .order("nomor_modul", { ascending: true })
                        .order("nomor_materi", { ascending: true })
                        .limit(1)
                        .single();
                      if (error || !firstMateri) {
                        alert("Tidak dapat menemukan materi pertama untuk kursus ini.");
                        return;
                      }
                      router.push(`/course/${realId}/learn/${firstMateri.id}`);
                    }}
                  >
                    Lanjutkan
                  </Button>
                ) : (
                  <Button
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 py-2 w-full bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20"
                    onClick={async () => {
                      const { data: firstMateri, error } = await supabase
                        .from("materi")
                        .select("id")
                        .eq("kursus_id", realId)
                        .order("nomor_modul", { ascending: true })
                        .order("nomor_materi", { ascending: true })
                        .limit(1)
                        .single();
                      if (error || !firstMateri) {
                        alert("Tidak dapat menemukan materi pertama untuk kursus ini.");
                        return;
                      }
                      router.push(`/course/${realId}/learn/${firstMateri.id}`);
                    }}
                  >
                    Tinjau
                  </Button>
                )}
            </CardContent>
          </Card>
          )
        })}
      </div>

      {kursusTersaring.length === 0 && (
        <div className="text-center py-12 border border-border rounded-lg bg-card p-8">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Tidak ada kursus ditemukan</h3>
          <p className="text-muted-foreground mb-6">
            {pencarian || filterTingkat !== "semua" || filterStatus !== "semua"
              ? "Coba ubah pencarian atau filter Anda"
              : "Buat kursus pertama Anda dari outline"}
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20" asChild>
            <Link href="/outline">
              <Plus className="h-4 w-4 mr-2" />
              Buat Kursus
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
