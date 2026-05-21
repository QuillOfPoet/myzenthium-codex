// src/lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js'

// Client khusus untuk server-side (bisa akses database dengan service_role)
// Untuk MVP, kita pakai anon key dulu dengan RLS yang dimatikan sementara
export const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)