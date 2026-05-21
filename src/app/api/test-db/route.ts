// src/app/api/test-db/route.ts
import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

export async function GET() {
  try {
    // Query langsung ke Supabase via REST API (bukan direct DB connection)
    const { data, error } = await supabaseServer
      .from('Project')
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('Supabase query error:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      projectCount: data === null ? 0 : undefined // head: true returns null data but count in header
    })
  } catch (e: any) {
    console.error('Unexpected error:', e)
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}