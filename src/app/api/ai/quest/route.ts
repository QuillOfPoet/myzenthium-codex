// src/app/api/ai/quest/route.ts
import { NextResponse } from 'next/server'
import { jsonrepair } from 'jsonrepair'
import { QUEST_SYSTEM_PROMPT } from '@/lib/ai-prompts'

// Helper: Log environment untuk debug (hanya di development)
function logEnvDebug() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 ENV DEBUG:', {
      hasGeminiKey: !!process.env.GEMINI_API_KEY,
      keyPreview: process.env.GEMINI_API_KEY?.slice(0, 10) + '...',
      nodeEnv: process.env.NODE_ENV,
      vercel: !!process.env.VERCEL,
    })
  }
}

// Helper: Mock quests fallback
function getMockQuests(entryContext: any) {
  return [
    {
      question: `[MOCK] Bagaimana ${entryContext.type} "${entryContext.title}" berinteraksi dengan elemen dunia lain?`,
      tier: 'BEGINNER',
      hint: 'Coba hubungkan dengan Nation, Faction, atau Magic System yang sudah ada.'
    },
    {
      question: `[MOCK] Apa konflik internal yang mungkin dihadapi ${entryContext.title}?`,
      tier: 'INTERMEDIATE',
      hint: 'Pikirkan tentang motivasi, ketakutan, atau harga yang harus dibayar.'
    }
  ]
}

export async function POST(request: Request) {
  logEnvDebug()
  
  try {
    const apiKey = process.env.GEMINI_API_KEY
    const { entryContext, draftSnippet } = await request.json()

    console.log('📥 Request received:', { 
      title: entryContext?.title, 
      type: entryContext?.type,
      hasApiKey: !!apiKey 
    })

    // Jika tidak ada API key, langsung return mock + warning
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found! Using mock quests.')
      return NextResponse.json({
        success: true,
        quests: getMockQuests(entryContext),
        source: 'mock-no-key',
        warning: 'API key not configured. Check Vercel Environment Variables.'
      })
    }

    // Bangun prompt
    const userPrompt = `
KONTEK ENTRY DUNIA:
- Tipe: ${entryContext.type}
- Judul: ${entryContext.title}
- Konten: ${entryContext.content?.slice(0, 500) || 'Belum ada konten'}

Buat 2-3 quest eksploratif. Output HARUS JSON valid: {"quests":[{"question":"...","tier":"...","hint":"..."}]}.
`.trim()

    const fullPrompt = `${QUEST_SYSTEM_PROMPT}\n\nUSER INPUT:\n${userPrompt}`
    
    // Coba call Gemini API dengan timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 detik timeout

    let response
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  maxOutputTokens: 4096,  // ← NAIKKAN! Agar respon tidak terpotong
},
          }),
          signal: controller.signal,
        }
      )
      clearTimeout(timeoutId)
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      if (fetchError.name === 'AbortError') {
        console.error('⏰ API call timed out')
        throw new Error('AI request timed out. Please try again.')
      }
      throw fetchError
    }

    console.log('📡 Gemini API Response Status:', response.status)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ Gemini API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })
      throw new Error(`Gemini API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      console.warn('⚠️ Empty response from Gemini, using mock')
      return NextResponse.json({
        success: true,
        quests: getMockQuests(entryContext),
        source: 'mock-empty-response'
      })
    }

    // GANTI parsing JSON section dengan ini:

    // Parse JSON dari response (handle incomplete/truncated responses)
    let cleanText = text.trim()
      .replace(/```json\n?/g, '').replace(/```\n?/g, '')
      .replace(/^(thought|thinking|reasoning)\s*\n?/i, '').trim()

    // Extract JSON: cari { pertama dan } terakhir
    const firstBrace = cleanText.indexOf('{')
    const lastBrace = cleanText.lastIndexOf('}')
    
    let parsed
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonOnly = cleanText.substring(firstBrace, lastBrace + 1)
      try {
        parsed = JSON.parse(jsonOnly)
      } catch (parseError: any) {
        // Coba repair dengan jsonrepair
        try {
          const repaired = jsonrepair(jsonOnly)
          parsed = JSON.parse(repaired)
          console.log('✅ jsonrepair succeeded')
        } catch {
          // Jika masih gagal, coba parse dengan menambahkan bracket penutup manual
          try {
            const fixed = jsonOnly.trimEnd() + (jsonOnly.trimEnd().endsWith(',') ? ']' : '') + '}'
            parsed = JSON.parse(fixed)
            console.log('✅ Manual bracket fix succeeded')
          } catch {
            console.warn('⚠️ All JSON parse attempts failed')
            throw parseError
          }
        }
      }
    } else {
      console.warn('⚠️ No valid JSON brackets found in response')
      throw new Error('Response does not contain valid JSON structure')
    }

    const quests = parsed.quests || []
    console.log('✅ AI Quests generated:', quests.length)

    return NextResponse.json({
      success: true,
      quests,
      source: 'ai'
    })

  } catch (error: any) {
    console.error('💥 AI Quest Error:', error)
    
    // Fallback ke mock agar UI tidak broken
    const { entryContext } = await request.json().catch(() => ({ entryContext: { type: 'Unknown', title: 'Entry' } }))
    
    return NextResponse.json({
      success: true,
      quests: getMockQuests(entryContext),
      source: 'mock-error-fallback',
      error: error.message
    }, { status: 200 }) // Return 200 agar UI tidak error, tapi tetap kasih mock
  }
}