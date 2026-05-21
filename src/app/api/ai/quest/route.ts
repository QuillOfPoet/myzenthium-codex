// src/app/api/ai/quest/route.ts
import { NextResponse } from 'next/server'
import { jsonrepair } from 'jsonrepair'
import { QUEST_SYSTEM_PROMPT } from '@/lib/ai-prompts'

// Helper: Coba multiple model dengan fallback
async function tryGenerateWithFallback(apiKey: string, prompt: string, models: string[]) {
  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 1024,
            },
          }),
        }
      )
      
      if (response.ok) {
        return await response.json()
      }
    } catch (e) {
      console.log(`⚠️ Model ${model} failed, trying next...`)
      continue
    }
  }
  throw new Error('All model attempts failed')
}

// Helper: Mock quests untuk development fallback
function getMockQuests(entryContext: any) {
  return [
    {
      question: `Bagaimana ${entryContext.type} "${entryContext.title}" berinteraksi dengan elemen dunia lain?`,
      tier: 'BEGINNER',
      hint: 'Coba hubungkan dengan Nation, Faction, atau Magic System yang sudah ada.'
    },
    {
      question: `Apa konflik internal atau dilema moral yang mungkin dihadapi ${entryContext.title}?`,
      tier: 'INTERMEDIATE',
      hint: 'Pikirkan tentang motivasi tersembunyi, ketakutan, atau harga yang harus dibayar.'
    },
    {
      question: `Jika ${entryContext.title} menghadapi krisis besar, apa yang akan mereka korbankan?`,
      tier: 'MASTER',
      hint: 'Eksplorasi tema: loyalitas vs prinsip, cinta vs tugas, tradisi vs perubahan.'
    }
  ]
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    const { entryContext, draftSnippet } = await request.json()

    // Bangun prompt
    const userPrompt = `
KONTEK ENTRY DUNIA:
- Tipe: ${entryContext.type}
- Judul: ${entryContext.title}
- Konten: ${entryContext.content?.slice(0, 500) || 'Belum ada konten'}
- Tags: ${entryContext.tags?.join(', ') || 'Tidak ada'}
- Status: ${entryContext.status}

${draftSnippet ? `\nDRAFT TERKAIT:\n"${draftSnippet.slice(0, 300)}..."` : ''}

Buat 2-3 quest eksploratif. Output HARUS JSON valid: {"quests":[{"question":"...","tier":"...","hint":"..."}]}.
`.trim()

    const fullPrompt = `${QUEST_SYSTEM_PROMPT}\n\nUSER INPUT:\n${userPrompt}`
    const availableModels = ['gemini-flash-latest', 'gemini-pro-latest', 'gemini-2.0-flash']

    let quests = []

    // --- MODE 1: Coba AI (jika API key ada) ---
    if (apiKey) {
      try {
        const data = await tryGenerateWithFallback(apiKey, fullPrompt, availableModels)
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (text) {
          // Bersihkan markdown & thinking sections
          let cleanText = text.trim()
            .replace(/```json\n?/g, '').replace(/```\n?/g, '')
            .replace(/^(thought|thinking|reasoning|analysis)\s*\n?/i, '').trim()

          // Extract JSON brackets
          const firstBrace = cleanText.indexOf('{')
          const lastBrace = cleanText.lastIndexOf('}')
          
          if (firstBrace !== -1 && lastBrace !== -1) {
            const jsonOnly = cleanText.substring(firstBrace, lastBrace + 1)
            
            // Coba parse normal dulu
            let parsed = JSON.parse(jsonOnly)
            quests = parsed.quests || []
          }
        }
      } catch (aiError: any) {
        console.log('⚠️ AI parsing failed, trying jsonrepair...')
        
        // --- MODE 2: Coba jsonrepair ---
        try {
          const data = await tryGenerateWithFallback(apiKey, fullPrompt, availableModels)
          let text = data.candidates?.[0]?.content?.parts?.[0]?.text
          
          if (text) {
            let cleanText = text.trim()
              .replace(/```json\n?/g, '').replace(/```\n?/g, '')
              .replace(/^(thought|thinking|reasoning|analysis)\s*\n?/i, '').trim()

            const firstBrace = cleanText.indexOf('{')
            const lastBrace = cleanText.lastIndexOf('}')
            
            if (firstBrace !== -1 && lastBrace !== -1) {
              const jsonOnly = cleanText.substring(firstBrace, lastBrace + 1)
              
              // REPAIR JSON yang rusak!
              const repaired = jsonrepair(jsonOnly)
              const parsed = JSON.parse(repaired)
              quests = parsed.quests || []
              console.log('✅ jsonrepair berhasil!')
            }
          }
        } catch (repairError: any) {
          console.log('⚠️ jsonrepair also failed, falling back to mock')
        }
      }
    }

    // --- MODE 3: Fallback ke mock jika AI gagal total ---
    if (!quests || quests.length === 0) {
      console.log('🧪 Using MOCK quests (AI unavailable or parsing failed)')
      quests = getMockQuests(entryContext)
    }

    return NextResponse.json({
      success: true,
      quests: quests,
      source: quests.length > 0 && quests[0].question.includes('[MOCK]') ? 'mock' : 'ai'
    })

  } catch (error: any) {
    console.error('AI Quest Error:', error)
    // Fallback terakhir: return mock quests agar UI tidak broken
    const { entryContext } = await request.json().catch(() => ({ entryContext: { type: 'Unknown', title: 'Entry' } }))
    return NextResponse.json({
      success: true,
      quests: getMockQuests(entryContext),
      source: 'mock-fallback',
      warning: 'AI unavailable, using mock quests'
    })
  }
}