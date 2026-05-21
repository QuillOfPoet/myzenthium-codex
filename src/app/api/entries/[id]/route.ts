// src/app/api/entries/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 🔑 Helper: Unwrap params Promise
async function getId(params: Promise<{ id: string }>): Promise<string> {
  const resolved = await params
  return resolved.id
}

// GET: Ambil 1 entry berdasarkan ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = await getId(params)  // ← AWAIT DI SINI!
  
  const { data, error } = await supabase
    .from('Entry')
    .select('*')
    .eq('id', id)
    .single()
    
  if (error || !data) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }
  return NextResponse.json({ entry: data })
}

// PUT: Update entry
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = await getId(params)  // ← AWAIT DI SINI!
  const body = await request.json()
  
  const { data, error } = await supabase
    .from('Entry')
    .update({
      title: body.title,
      type: body.type,
      content: body.content,
      status: body.status || 'DRAFT',
      updatedAt: new Date().toISOString()
    })
    .eq('id', id)
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ success: true, entry: data?.[0] })
}

// DELETE: Hapus entry
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = await getId(params)  // ← AWAIT DI SINI!
  
  const { error } = await supabase
    .from('Entry')
    .delete()
    .eq('id', id)
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json({ success: true })
}