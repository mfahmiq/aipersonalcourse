/**
 * Konfigurasi Supabase Client
 * File ini membuat dan mengekspor instance Supabase client untuk digunakan di seluruh aplikasi
 */

import { createClient } from "@supabase/supabase-js"

// Mengambil URL dan API key Supabase dari environment variables
// NEXT_PUBLIC_ prefix memungkinkan variabel ini diakses di client-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Membuat dan mengekspor instance Supabase client
// Client ini akan digunakan untuk semua operasi database dan autentikasi
export const supabase = createClient(supabaseUrl, supabaseAnonKey) 