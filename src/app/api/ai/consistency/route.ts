// src/app/api/ai/consistency/route.ts
import { NextResponse } from 'next/server'
import { jsonrepair } from 'jsonrepair'
import { CONSISTENCY_SYSTEM_PROMPT } from '@/lib/ai-prompts'

export async function POST(request: Request) {
  // Deklarasikan di luar try agar bisa diakses di catch
  let entryContext: any = null
  
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) throw new Error('GEMINI_API_KEY not found')

    const body = await request.json()
    entryContext = body.entryContext // Simpan ke variabel luar
    const { relatedEntries } = body

    // Bangun prompt
    const relatedContext = relatedEntries?.slice(0, 3).map((e: any) => 
      `- [${e.type}] ${e.title}: ${(e.content || '').slice(0, 200)}...`
    ).join('\n') || 'Tidak ada entry terkait.'

    const userPrompt = `
ENTRY UTAMA:
- Tipe: ${entryContext.type}
- Judul: ${entryContext.title}
- Konten: ${entryContext.content?.slice(0, 800) || 'N/A'}

ENTRY TERKAIT:
${relatedContext}

Tugas: Cek konsistensi. Output HARUS JSON valid.
`.trim()

    const fullPrompt = `${CONSISTENCY_SYSTEM_PROMPT}\n\nUSER INPUT:\n${userPrompt}`

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 4096,
          },
        }),
      }
    )

    if (!response.ok) throw new Error(`API Error: ${response.status}`)

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) throw new Error('Empty response')

    // Parse JSON dengan jsonrepair
    let cleanText = text.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '')
      .replace(/^(thought|thinking|reasoning)\s*\n?/i, '').trim()

    const firstBrace = cleanText.indexOf('{')
    const lastBrace = cleanText.lastIndexOf('}')
    
    let parsed
    if (firstBrace !== -1 && lastBrace !== -1) {
      const jsonOnly = cleanText.substring(firstBrace, lastBrace + 1)
      try {
        parsed = JSON.parse(jsonOnly)
      } catch {
        const repaired = jsonrepair(jsonOnly)
        parsed = JSON.parse(repaired)
      }
    } else {
      throw new Error('No JSON found')
    }

    return NextResponse.json({
      success: true,
      comments: parsed.comments || [],
      summary: parsed.summary || 'Analisis selesai.',
      source: 'ai'
    })

  } catch (error: any) {
    console.error('Consistency Error:', error)
    
    // Fallback Mock - gunakan entryContext yang sudah dideklarasikan di luar
    const entryTitle = entryContext?.title || 'Entry ini'
    
    return NextResponse.json({
      success: true,
      comments: [{
        type: 'suggestion',
        message: `[MOCK] Periksa apakah "${entryTitle}" konsisten dengan entry lain tentang lokasi, timeline, atau karakter terkait.`,
        severity: 'low'
      }],
      summary: '[MOCK] Konsistensi belum dapat dianalisis penuh. Pastikan API key valid dan entry terkait sudah dibuat.',
      source: 'mock-fallback',
      error: error.message
    }, { status: 200 })
  }
}