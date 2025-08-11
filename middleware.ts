import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // If user is not signed in and trying to access protected routes
    if (!session && !["/", "/login", "/register"].includes(req.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/login", req.url))
    }

    // If user is signed in and the current path is /login or /register,
    // redirect the user to /dashboard (only for these specific pages)
    if (session && ["/login", "/register"].includes(req.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  } catch (error) {
    console.error("Middleware auth error:", error)
    // If there's an auth error, redirect to login for protected routes
    if (!["/", "/login", "/register"].includes(req.nextUrl.pathname)) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  return res
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
} 