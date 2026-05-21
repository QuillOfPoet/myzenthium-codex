// src/app/api/entries/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Inisialisasi Supabase Client untuk Server
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// ID Project yang kita buat tadi (Hardcoded untuk MVP)
const PROJECT_ID = 'proj-myzenthium-01'

// 1. GET: Mengambil semua Entry
export async function GET() {
  const { data, error } = await supabase
    .from('Entry')
    .select('*')
    .eq('projectId', PROJECT_ID)
    .order('createdAt', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  
  return NextResponse.json({ entries: data || [] })
}

// 2. POST: Membuat Entry Baru
export async function POST(request: Request) {
  const body = await request.json()
  
  const { data, error } = await supabase
    .from('Entry')
    .insert([
      {
        projectId: PROJECT_ID, // Link ke project dummy
        type: body.type,
        title: body.title,
        content: body.content,
        status: 'DRAFT',
        canonLevel: 'SOFT',
        tags: [],
      },
    ])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, entry: data?.[0] })
}