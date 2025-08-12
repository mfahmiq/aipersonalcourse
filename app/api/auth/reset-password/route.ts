import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return NextResponse.json(
        { error: 'Service role key tidak dikonfigurasi. Silakan tambahkan SUPABASE_SERVICE_ROLE_KEY ke file .env.local' },
        { status: 500 }
      )
    }

    const { email, newPassword } = await request.json()
    
    if (!email || !newPassword) {
      return NextResponse.json(
        { error: 'Email dan password baru diperlukan' },
        { status: 400 }
      )
    }

    // Import supabase admin dynamically to avoid build issues
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration:', { 
        hasUrl: !!supabaseUrl, 
        hasServiceKey: !!supabaseServiceKey 
      })
      return NextResponse.json(
        { error: 'Konfigurasi Supabase tidak lengkap' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Cek apakah user exists dengan listUsers
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (userError) {
      console.error('Error listing users:', userError)
      return NextResponse.json(
        { error: 'Gagal memverifikasi email: ' + userError.message },
        { status: 500 }
      )
    }

    const user = users.users.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Email tidak ditemukan' },
        { status: 404 }
      )
    }

    // Update password user
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Error updating password:', updateError)
      return NextResponse.json(
        { error: 'Gagal mengubah password: ' + updateError.message },
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
