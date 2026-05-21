// src/app/api/ai/consistency/route.ts
import { NextResponse } from 'next/server'
import { jsonrepair } from 'jsonrepair'
import { CONSISTENCY_SYSTEM_PROMPT } from '@/lib/ai-prompts'

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY not found')
    }

    const { entryContext, relatedEntries } = await request.json()

    // Bangun prompt dengan konteks entry utama + entry terkait
    const relatedContext = relatedEntries?.slice(0, 3).map((e: any) => 
      `- [${e.type}] ${e.title}: ${(e.content || '').slice(0, 200)}...`
    ).join('\n') || 'Tidak ada entry terkait yang disediakan.'

    const userPrompt = `
ENTRY UTAMA YANG DIAKUI:
- Tipe: ${entryContext.type}
- Judul: ${entryContext.title}
- Konten: ${entryContext.content?.slice(0, 800) || 'Belum ada konten'}
- Tags: ${entryContext.tags?.join(', ') || 'Tidak ada'}

ENTRY TERKAIT (untuk konteks konsistensi):
${relatedContext}

Tugas: Cek konsistensi entry utama terhadap entry terkait & aturan dunia implisit.
Output HARUS JSON valid sesuai format system prompt.
`.trim()

    const fullPrompt = `${CONSISTENCY_SYSTEM_PROMPT}\n\nUSER INPUT:\n${userPrompt}`

    // Call Gemini API dengan timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 detik untuk analisis lebih dalam

    let response
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
              temperature: 0.3, // Lebih deterministik untuk analisis
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 4096,
            },
          }),
          signal: controller.signal,
        }
      )
      clearTimeout(timeoutId)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        throw new Error('Consistency check timed out. Please try again.')
      }
      throw fetchError
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      return NextResponse.json({
        success: true,
        comments: [],
        summary: 'Tidak ada feedback dari AI. Coba lagi nanti.',
        source: 'empty-response'
      })
    }

    // Parse JSON dengan repair
    let cleanText = text.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '')
      .replace(/^(thought|thinking|reasoning)\s*\n?/i, '').trim()

    const firstBrace = cleanText.indexOf('{')
    const lastBrace = cleanText.lastIndexOf('}')
    
    let parsed
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonOnly = cleanText.substring(firstBrace, lastBrace + 1)
      try {
        parsed = JSON.parse(jsonOnly)
      } catch {
        try {
          const repaired = jsonrepair(jsonOnly)
          parsed = JSON.parse(repaired)
        } catch {
          throw new Error('Failed to parse consistency response')
        }
      }
    } else {
      throw new Error('No valid JSON in consistency response')
    }

    return NextResponse.json({
      success: true,
      comments: parsed.comments || [],
      summary: parsed.summary || 'Analisis selesai.',
      source: 'ai'
    })

    } catch (error: any) {
    console.error('Consistency Check Error:', error)
    
    // Fallback ke mock feedback agar UI tidak broken
    return NextResponse.json({
      success: true,
      comments: [
        {
          type: 'suggestion',
          message: `[MOCK] Periksa konsistensi entry ini dengan entry lain tentang lokasi, timeline, atau karakter terkait.`,
          severity: 'low'
        }
      ],
      summary: '[MOCK] Konsistensi belum dapat dianalisis penuh. Pastikan entry terkait sudah dibuat.',
      source: 'mock-fallback',
      error: error.message
    }, { status: 200 })
  }
}