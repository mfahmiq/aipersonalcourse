"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({ full_name: "", email: "" })
  const [newName, setNewName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [message, setMessage] = useState("")
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setLoading(false)
        return
      }
      setUserId(session.user.id)
      // Fetch from settings table
      const { data: settingsData, error } = await supabase
        .from("settings")
        .select("full_name, email")
        .eq("id", session.user.id)
        .single()
      const authEmail = session.user.email || ""
      if (settingsData) {
        setSettings({
          full_name: settingsData.full_name || "",
          email: settingsData.email || authEmail
        })
        setNewName(settingsData.full_name || "")
        setNewEmail(settingsData.email || authEmail)
        // Sync email if different
        if (settingsData.email !== authEmail) {
          await supabase
            .from("settings")
            .update({ email: authEmail })
            .eq("id", session.user.id)
        }
      } else {
        // fallback to auth user email if no settings row
        setSettings({ full_name: "", email: authEmail })
        setNewName("")
        setNewEmail(authEmail)
        // Insert row if not exists
        await supabase
          .from("settings")
          .insert({ id: session.user.id, email: authEmail })
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
    // Update email in Supabase Auth if changed
    let authError = null
    if (newEmail !== settings.email) {
      const { error } = await supabase.auth.updateUser({ email: newEmail })
      authError = error
    }
    // Update password if filled
    let pwError = null
    if (newPassword) {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      pwError = error
    }
    if (dbError || authError || pwError) setMessage("Failed to update profile.")
    else setMessage("Profile updated!")
    // Always re-fetch and sync after update
    const { data: { session } } = await supabase.auth.getSession()
    const authEmail = session?.user?.email || newEmail
    await supabase
      .from("settings")
      .update({ email: authEmail })
      .eq("id", userId)
    setSettings((p) => ({ ...p, email: authEmail, full_name: newName }))
    setNewEmail(authEmail)
    setNewPassword("")
    setLoading(false)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-white py-8">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-8 border border-zinc-200">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-1 tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground text-base">Edit your account information below.</p>
        </div>
        {/* Display current name and email */}
        <div className="mb-6 flex flex-col items-center gap-1">
          <div className="text-lg font-semibold text-zinc-800">{settings.full_name || "-"}</div>
          <div className="text-sm text-zinc-500">{settings.email || "-"}</div>
        </div>
        {message && <div className="mb-4 text-green-600 font-medium text-center animate-fade-in">{message}</div>}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <form className="space-y-7" onSubmit={e => { e.preventDefault(); handleSaveAll(); }}>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 flex flex-col gap-2 shadow-sm">
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Display Name</label>
              <input
                type="text"
                className="transition-all focus:ring-2 focus:ring-primary focus:border-primary border border-zinc-200 bg-white rounded-lg px-3 py-2 text-base text-foreground placeholder:text-zinc-400 outline-none"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                disabled={loading}
                placeholder="Your name"
              />
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 flex flex-col gap-2 shadow-sm">
              <label className="block text-sm font-semibold text-zinc-700 mb-1">Email</label>
              <input
                type="email"
                className="transition-all focus:ring-2 focus:ring-primary focus:border-primary border border-zinc-200 bg-white rounded-lg px-3 py-2 text-base text-foreground placeholder:text-zinc-400 outline-none"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                disabled={loading}
                placeholder="your@email.com"
              />
            </div>
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-5 flex flex-col gap-2 shadow-sm">
              <label className="block text-sm font-semibold text-zinc-700 mb-1">New Password</label>
              <input
                type="password"
                className="transition-all focus:ring-2 focus:ring-primary focus:border-primary border border-zinc-200 bg-white rounded-lg px-3 py-2 text-base text-foreground placeholder:text-zinc-400 outline-none"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full mt-4 px-5 py-3 bg-primary text-white rounded-lg font-semibold shadow hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              disabled={loading || (!newName && !newEmail && !newPassword)}
            >Save Changes</button>
          </form>
        )}
      </div>
    </div>
  )
}
