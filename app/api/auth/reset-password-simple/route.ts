import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()
    
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email dan password baru diperlukan' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration')
      return NextResponse.json(
        { error: 'Konfigurasi Supabase tidak lengkap' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // Cek apakah user exists dengan query ke tabel profil
    const { data: profile, error: profileError } = await supabase
      .from('profil')
      .select('id, email')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Email tidak ditemukan' },
        { status: 404 }
      )
    }

    // Gunakan reset password dengan email (ini akan mengirim email reset)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login`
    })

    if (resetError) {
      console.error('Error resetting password:', resetError)
      return NextResponse.json(
        { error: 'Gagal mengirim email reset password: ' + resetError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Email reset password telah dikirim. Silakan cek email Anda.' },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server: ' + error.message },
      { status: 500 }
    )
  }
}
