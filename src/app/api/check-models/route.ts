// src/app/api/check-models/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY
  
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not found' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      { method: 'GET' }
    )
    
    const data = await res.json()
    
    // Filter hanya model yang support generateContent
    const availableModels = data.models?.filter((m: any) => 
      m.supportedGenerationMethods?.includes('generateContent')
    ).map((m: any) => ({
      name: m.name,
      methods: m.supportedGenerationMethods
    })) || []

    return NextResponse.json({
      success: true,
      totalModels: data.models?.length || 0,
      availableForGenerateContent: availableModels,
      tip: 'Gunakan nama model dari field "name" (tanpa prefix "models/")'
    })

  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}