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

    // Untuk implementasi tanpa service role key, kita perlu menggunakan pendekatan lain
    // Salah satu cara adalah dengan membuat temporary token atau menggunakan SQL function
    
    // Implementasi sederhana: update password melalui SQL function
    // Ini memerlukan setup di Supabase terlebih dahulu
    
    const { error: sqlError } = await supabase.rpc('reset_user_password', {
      user_email: email,
      new_password: newPassword
    })

    if (sqlError) {
      console.error('Error resetting password via SQL:', sqlError)
      return NextResponse.json(
        { error: 'Gagal mengubah password. Silakan hubungi administrator.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Password berhasil diubah' },
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
