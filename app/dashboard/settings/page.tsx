"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

console.log("SettingsPage file loaded");

export default function SettingsPage() {
  const supabase = createClientComponentClient();
  console.log("SettingsPage component rendered");
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({ full_name: "", email: "" })
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    console.log("Settings useEffect running...");
    const fetchSettings = async () => {
      console.log("Start fetchSettings");
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Session:", session);
      if (!session) {
        console.log("No session, returning");
        setLoading(false);
        return;
      }
      setUserId(session.user.id);
      console.log("UserId set:", session.user.id);
      const authEmail = session.user.email || "";
      const authFullName = session.user.user_metadata?.full_name || "";
      console.log("authEmail:", authEmail, "authFullName:", authFullName);
      // Fetch from settings table
      const { data: settingsData, error } = await supabase
        .from("settings")
        .select("full_name, email")
        .eq("id", session.user.id)
        .single();
      console.log("settingsData:", settingsData, "error:", error);
      // Debug log for fetched data
      console.log("settingsData:", settingsData, "authEmail:", authEmail, "authFullName:", authFullName);
      // Fallback logic (treat 'EMPTY' as empty)
      let displayName = (settingsData?.full_name && settingsData.full_name !== "EMPTY") ? settingsData.full_name : authFullName || "";
      let displayEmail = (settingsData?.email && settingsData.email !== "EMPTY") ? settingsData.email : authEmail || "";
      console.log("displayName:", displayName, "displayEmail:", displayEmail);
      setSettings({
        full_name: displayName,
        email: displayEmail
      })
      setNewName(displayName)
      setNewEmail(displayEmail)
      // Insert if not exists
      if (!settingsData) {
        await supabase
          .from("settings")
          .insert({ id: session.user.id, email: authEmail, full_name: authFullName })
      } else {
        // If full_name or email is empty, update with auth values
        if (!settingsData.full_name && authFullName) {
          await supabase
            .from("settings")
            .update({ full_name: authFullName })
            .eq("id", session.user.id)
        }
        if (!settingsData.email && authEmail) {
          await supabase
            .from("settings")
            .update({ email: authEmail })
            .eq("id", session.user.id)
        }
      }
      setLoading(false)
    }
    fetchSettings()
  }, [])

  // New unified save handler
  const handleSaveAll = async () => {
    setMessage("")
    setLoading(true)
    if (!userId) {
      setLoading(false)
      return
    }
    // Update name and email in settings table
    const { error: dbError } = await supabase
      .from("settings")
      .upsert({ id: userId, full_name: newName, email: newEmail }, { onConflict: "id" })

    // Update nama di Supabase Auth (user_metadata)
    let metaError = null
    if (newName !== settings.full_name) {
      const { error } = await supabase.auth.updateUser({ data: { full_name: newName } })
      metaError = error
    }

    // Update email di Supabase Auth hanya jika berubah dan valid
    let authError = null
    if (newEmail !== settings.email && newEmail) {
      // Hanya kirim field email saja
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      if (error) {
        console.log('Supabase Auth update email error:', error);
      }
      authError = error
    }
    // Update password jika diisi
    let pwError = null
    if (newPassword) {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      pwError = error
    }
    // Tampilkan error detail
    if (dbError || authError || pwError || metaError) {
      setMessage(authError?.message || dbError?.message || pwError?.message || metaError?.message || "Failed to update profile.");
      // Jangan update state email jika gagal
    } else {
      setMessage("Profile updated!");
      // Hanya update state jika berhasil
      const { data: { session } } = await supabase.auth.getSession();
      const authEmail = session?.user?.email || newEmail;
      setSettings((p) => ({ ...p, email: authEmail, full_name: newName }));
      setNewEmail(authEmail);
    }
    setNewPassword("");
    setLoading(false);
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-background py-8">
      <div className="w-full max-w-lg bg-background shadow-xl rounded-2xl p-8 border border-border">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-1 tracking-tight">Pengaturan Profil</h1>
          <p className="text-muted-foreground text-base">Edit informasi akun Anda di bawah ini.</p>
        </div>
        {/* Display current name and email */}
        <div className="mb-6 flex flex-col items-center gap-1">
          <div className="text-lg font-semibold text-foreground">{settings.full_name || "-"}</div>
          <div className="text-sm text-muted-foreground">{settings.email || "-"}</div>
        </div>
        {message && <div className="mb-4 text-green-600 font-medium text-center animate-fade-in">{message === "Profile updated!" ? "Profil berhasil diperbarui!" : message === "Failed to update profile." ? "Gagal memperbarui profil." : message}</div>}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Memuat...</div>
        ) : (
          <form className="space-y-7" onSubmit={e => { e.preventDefault(); handleSaveAll(); }}>
            <div className="rounded-xl border border-border bg-muted p-5 flex flex-col gap-2 shadow-sm">
              <label className="block text-sm font-semibold text-foreground mb-1">Nama Lengkap</label>
              <input
                type="text"
                className="transition-all focus:ring-2 focus:ring-primary focus:border-primary border border-border bg-background rounded-lg px-3 py-2 text-base text-foreground placeholder:text-muted-foreground outline-none"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                disabled={loading}
                placeholder="Nama Anda"
              />
            </div>
            <div className="rounded-xl border border-border bg-muted p-5 flex flex-col gap-2 shadow-sm">
              <label className="block text-sm font-semibold text-foreground mb-1">Email</label>
              <input
                type="email"
                className="transition-all focus:ring-2 focus:ring-primary focus:border-primary border border-border bg-background rounded-lg px-3 py-2 text-base text-foreground placeholder:text-muted-foreground outline-none"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                disabled={loading}
                placeholder="email@anda.com"
              />
            </div>
            <div className="rounded-xl border border-border bg-muted p-5 flex flex-col gap-2 shadow-sm">
              <label className="block text-sm font-semibold text-foreground mb-1">Kata Sandi Baru</label>
              <input
                type="password"
                className="transition-all focus:ring-2 focus:ring-primary focus:border-primary border border-border bg-background rounded-lg px-3 py-2 text-base text-foreground placeholder:text-muted-foreground outline-none"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              className="w-full mt-4 px-5 py-3 bg-primary text-white rounded-lg font-semibold shadow hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              disabled={loading || (!newName && !newEmail && !newPassword)}
            >Simpan Perubahan</button>
          </form>
        )}
      </div>
    </div>
  )
}
