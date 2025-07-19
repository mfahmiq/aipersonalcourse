/**
 * Auth Callback Route Handler
 * File ini menangani callback dari Supabase Auth setelah proses login/register
 * Digunakan untuk menukar authorization code dengan session
 */

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

/**
 * GET handler untuk auth callback
 * Route ini dipanggil oleh Supabase setelah user berhasil login/register
 * 
 * @param request - Request object dari Next.js
 * @returns Response dengan redirect ke dashboard
 */
export async function GET(request: Request) {
  // Mengambil URL request untuk mendapatkan authorization code
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  // Jika ada authorization code, tukar dengan session
  if (code) {
    // Membuat Supabase client untuk route handler
    const supabase = createRouteHandlerClient({ cookies })
    
    // Menukar authorization code dengan session
    // Ini akan menyimpan session di cookies
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect ke dashboard setelah proses autentikasi selesai
  return NextResponse.redirect(new URL("/dashboard", request.url))
} 