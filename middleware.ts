/**
 * Middleware untuk autentikasi dan proteksi rute
 * File ini menangani redirect otomatis berdasarkan status login user
 */

import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Middleware function yang dijalankan sebelum setiap request
 * @param req - Request object dari Next.js
 * @returns Response object atau redirect
 */
export async function middleware(req: NextRequest) {
  // Membuat response default
  const res = NextResponse.next()
  
  // Membuat client Supabase untuk middleware
  const supabase = createMiddlewareClient({ req, res })

  // Mengambil session user dari Supabase
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Jika user tidak login dan mencoba mengakses rute yang dilindungi
  // Redirect ke halaman login
  if (!session && !["/", "/login", "/register"].includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Jika user sudah login dan berada di halaman login atau register
  // Redirect ke dashboard
  if (session && ["/login", "/register"].includes(req.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

// Konfigurasi middleware - menentukan rute mana yang akan diproses
export const config = {
  // Matcher untuk semua rute kecuali API, static files, dan favicon
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
} 