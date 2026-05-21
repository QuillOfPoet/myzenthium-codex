// src/app/world/[id]/page.tsx
'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

type PageProps = {
  params: Promise<{ id: string }>
}

export default function EntryDetail({ params }: PageProps) {
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  
  const router = useRouter()
  const [entry, setEntry] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '', type: 'Character', content: '', status: 'DRAFT'
  })

  // State untuk AI Panel (BARU)
  const [showAiPanel, setShowAiPanel] = useState(false)
  const [quests, setQuests] = useState<any[]>([])
  const [questLoading, setQuestLoading] = useState(false)
  const [questError, setQuestError] = useState('')

  // 1. Ambil data entry
  useEffect(() => {
    if (!id) return
    
    fetch(`/api/entries/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.entry) {
          setEntry(data.entry)
          setFormData({
            title: data.entry.title,
            type: data.entry.type,
            content: data.entry.content || '',
            status: data.entry.status || 'DRAFT'
          })
        }
        setLoading(false)
      })
  }, [id])

  // 2. Simpan perubahan
  const handleSave = async () => {
    const res = await fetch(`/api/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    if (res.ok) {
      const updated = await res.json()
      setEntry(updated.entry)
      setIsEditing(false)
    } else {
      alert('Gagal menyimpan')
    }
  }

  // 3. Hapus entry
  const handleDelete = async () => {
    if (!confirm('Hapus entry ini permanen?')) return
    const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/world')
  }

  // 4. Request Quest ke AI (BARU)
  const handleAskAI = async () => {
    if (!entry) return
    setQuestLoading(true)
    setQuestError('')
    setShowAiPanel(true)
    
    try {
      const res = await fetch('/api/ai/quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryContext: {
            type: entry.type,
            title: entry.title,
            content: entry.content, // AI dapat baca full content sekarang!
            tags: [],
            status: entry.status
          },
          draftSnippet: ''
        }),
      })
      const data = await res.json()
      if (data.success) setQuests(data.quests)
      else setQuestError(data.error || 'Gagal generate quest')
    } catch (e: any) {
      setQuestError('Error koneksi: ' + e.message)
    } finally {
      setQuestLoading(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      <span className="ml-3">Memuat entry...</span>
    </div>
  )
  
  if (!entry) return (
    <div className="min-h-screen flex items-center justify-center text-red-400">
      Entry tidak ditemukan.
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        
        {/* Navigasi Atas */}
        <div className="flex justify-between items-center mb-6">
          <button 
            onClick={() => router.push('/world')} 
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition"
          >
            ← Kembali ke Arsip
          </button>
          {!isEditing && (
             <button 
               onClick={handleAskAI} 
               className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/30 px-4 py-2 rounded-lg text-sm font-medium transition"
             >
               ✨ Dapatkan Inspirasi AI
             </button>
          )}
        </div>

        {/* Konten Utama */}
        {!isEditing ? (
          // MODE BACA
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-lg">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
              <div>
                <span className="inline-block text-xs font-mono bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full border border-purple-500/30">
                  {entry.type}
                </span>
                <h1 className="text-4xl md:text-5xl font-bold mt-4 text-white">{entry.title}</h1>
              </div>
              <div className="flex gap-3 shrink-0">
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition"
                >
                  ✏️ Edit
                </button>
                <button 
                  onClick={handleDelete} 
                  className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 px-6 py-2 rounded-lg text-sm font-medium transition"
                >
                  🗑️
                </button>
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-gray-300 leading-loose text-lg whitespace-pre-wrap font-serif">
              {entry.content || <span className="text-gray-600 italic">Belum ada konten. Klik Edit untuk mulai menulis.</span>}
            </div>

            <div className="mt-10 pt-6 border-t border-gray-800 flex justify-between text-xs text-gray-500 font-mono">
              <span>STATUS: {entry.status}</span>
              <span>LAST UPDATED: {new Date(entry.updatedAt || entry.createdAt).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        ) : (
          // MODE EDIT
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-white">️ Edit Entry</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Judul</label>
                  <input 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Tipe</label>
                  <select 
                    value={formData.type} 
                    onChange={e => setFormData({...formData, type: e.target.value})} 
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-white"
                  >
                    <option>Character</option><option>Nation</option><option>City</option>
                    <option>Magic System</option><option>Creature</option><option>Artifact</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Konten</label>
                <textarea 
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})} 
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 text-white h-80 focus:ring-2 focus:ring-cyan-500 outline-none font-mono text-sm leading-relaxed"
                  placeholder="Tulis lore di sini..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  onClick={handleSave} 
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition"
                >
                  💾 Simpan
                </button>
                <button 
                  onClick={() => setIsEditing(false)} 
                  className="bg-gray-700 hover:bg-gray-600 text-gray-200 px-8 py-3 rounded-lg font-medium transition"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI QUEST PANEL (BARU) */}
        {showAiPanel && (
          <div className="mt-10 bg-gradient-to-br from-gray-900 to-purple-900/20 border border-purple-500/30 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-purple-300">✨ AI Quests untuk "{entry.title}"</h2>
              <button onClick={() => setShowAiPanel(false)} className="text-gray-400 hover:text-white"> Tutup</button>
            </div>

            {questLoading ? (
              <div className="flex items-center gap-3 text-purple-300 py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
                <span>AI sedang membaca lore Anda dan meracik pertanyaan...</span>
              </div>
            ) : questError ? (
              <p className="text-red-400 bg-red-900/20 p-4 rounded-lg">{questError}</p>
            ) : quests.length > 0 ? (
              <div className="space-y-4">
                {quests.map((quest: any, idx: number) => (
                  <div key={idx} className="bg-gray-800/50 border-l-4 border-cyan-400 p-4 rounded-lg hover:bg-gray-800/80 transition">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <p className="text-gray-100 font-medium text-lg">{quest.question}</p>
                      <span className={`shrink-0 text-xs px-2 py-1 rounded font-mono ${
                        quest.tier === 'BEGINNER' ? 'bg-green-900/50 text-green-300' :
                        quest.tier === 'INTERMEDIATE' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-red-900/50 text-red-300'
                      }`}>{quest.tier}</span>
                    </div>
                    {quest.hint && <p className="text-gray-400 text-sm italic">💡 {quest.hint}</p>}
                  </div>
                ))}
                <div className="pt-4">
                  <button onClick={handleAskAI} className="text-sm text-cyan-400 hover:text-cyan-300 underline">
                    🔄 Generate Ulang Pertanyaan
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Belum ada quest.</p>
            )}
          </div>
        )}

      </div>
    </div>
  )
}