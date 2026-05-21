// src/app/world/[id]/page.tsx
'use client'
import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'

type PageProps = {
  params: Promise<{ id: string }>
}

export default function NaskahDetail({ params }: PageProps) {
  const unwrappedParams = use(params)
  const id = unwrappedParams.id
  const router = useRouter()
  
  // State
  const [naskah, setNaskah] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sedangSunting, setSedangSunting] = useState(false)
  const [formData, setFormData] = useState({ title: '', type: 'Character', content: '', status: 'DRAFT' })

  const [tampilPanelAI, setTampilPanelAI] = useState(false)
  const [quest, setQuest] = useState<any[]>([])
  const [questLoading, setQuestLoading] = useState(false)
  const [questError, setQuestError] = useState('')

  const [tampilKonsistensi, setTampilKonsistensi] = useState(false)
  const [komentarKonsistensi, setKomentarKonsistensi] = useState<any[]>([])
  const [ringkasanKonsistensi, setRingkasanKonsistensi] = useState('')
  const [konsistensiLoading, setKonsistensiLoading] = useState(false)
  const [konsistensiError, setKonsistensiError] = useState('')

  // ✅ PERBAIKAN: useEffect hanya untuk logika pengambilan data
  useEffect(() => {
    if (!id) return
    
    fetch(`/api/entries/${id}`)
      .then(res => res.json())
      .then(data => {
        // Cek apakah data ada di field 'naskah' atau 'entry'
        const entryData = data.naskah || data.entry
        if (entryData) {
          setNaskah(entryData)
          setFormData({
            title: entryData.title,
            type: entryData.type,
            content: entryData.content || '',
            status: entryData.status || 'DRAFT'
          })
        }
        setLoading(false)
      })
  }, [id])

  const simpanPerubahan = async () => {
    const res = await fetch(`/api/entries/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    if (res.ok) {
      const updated = await res.json()
      setNaskah(updated.naskah || updated.entry)
      setSedangSunting(false)
    } else {
      alert('Gagal menyimpan perubahan')
    }
  }

  const lenyapkanNaskah = async () => {
    if (!confirm('Yakin ingin melenyapkan kisah ini selamanya?')) return
    const res = await fetch(`/api/entries/${id}`, { method: 'DELETE' })
    if (res.ok) router.push('/world')
  }

  const mintaQuestAI = async () => {
    if (!naskah) return
    setQuestLoading(true)
    setQuestError('')
    setTampilPanelAI(true)
    
    try {
      const res = await fetch('/api/ai/quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryContext: { type: naskah.type, title: naskah.title, content: naskah.content, tags: [], status: naskah.status },
          draftSnippet: ''
        }),
      })
      const data = await res.json()
      if (data.success) setQuest(data.quests)
      else setQuestError(data.error || 'Gagal meracik pertanyaan')
    } catch (e: any) {
      setQuestError('Error koneksi: ' + e.message)
    } finally {
      setQuestLoading(false)
    }
  }

  const periksaKonsistensi = async () => {
    if (!naskah) return
    setKonsistensiLoading(true)
    setKonsistensiError('')
    setTampilKonsistensi(true)
    
    try {
      const allEntriesRes = await fetch('/api/entries')
      const allEntriesData = await allEntriesRes.json()
      const relatedEntries = (allEntriesData.entries || allEntriesData.naskah || [])
        .filter((e: any) => e.id !== id)
        .slice(0, 5)
      
      const res = await fetch('/api/ai/consistency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryContext: { type: naskah.type, title: naskah.title, content: naskah.content, tags: naskah.tags, status: naskah.status },
          relatedEntries
        }),
      })
      
      const data = await res.json()
      if (data.success) {
        setKomentarKonsistensi(data.comments)
        setRingkasanKonsistensi(data.summary)
      } else {
        setKonsistensiError(data.error || 'Gagal menganalisis')
      }
    } catch (e: any) {
      setKonsistensiError('Error koneksi: ' + e.message)
    } finally {
      setKonsistensiLoading(false)
    }
  }

  // Loading State
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-water-300">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-water-300"></div>
      <span className="ml-3 font-lore">Memuat naskah...</span>
    </div>
  )
  
  // Not Found State
  if (!naskah) return (
    <div className="min-h-screen flex items-center justify-center text-red-400 font-lore">
      Naskah tidak ditemukan.
    </div>
  )

  // ✅ RENDER UI (Hanya di dalam return)
  return (
    <div className="min-h-screen p-6 md:p-10">
      <div className="max-w-4xl mx-auto">
        
        {/* Tombol Aksi (Sudah dihapus tombol 'Kembali' yang redundan) */}
        {!sedangSunting && (
          <div className="flex justify-end gap-2 mb-6">
            <button 
              onClick={mintaQuestAI} 
              className="btn-water btn-ai-sparkle px-4 py-2 font-epic text-sm"
            >
              ✨ Tanya Penasihat
            </button>
            <button 
              onClick={periksaKonsistensi} 
              className="flex items-center gap-2 bg-emerald-700/20 hover:bg-emerald-700/40 text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-lg text-sm font-medium transition font-epic"
            >
              🔍 Periksa Konsistensi
            </button>
          </div>
        )}

        {/* MODE BACA */}
        {!sedangSunting ? (
          <div className="pool-card p-8 shadow-lg relative overflow-hidden">
            {/* Background Watermark Aumithia (CSS) */}
            <div className="absolute top-10 right-10 text-9xl opacity-5 pointer-events-none select-none text-water-300 font-serif">💧</div>

            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8 relative z-10">
              <div>
                <span className="inline-block text-xs font-mono bg-water-900/50 text-water-300 px-3 py-1 rounded-full border border-water-500/30">
                  {naskah.type}
                </span>
                {/* Judul dengan Shimmer Effect */}
                <h1 className="text-4xl md:text-5xl font-bold mt-4 font-epic drop-shadow-[0_0_10px_rgba(255,213,79,0.5)] text-shimmer">
                  {naskah.title}
                </h1>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => setSedangSunting(true)} className="btn-water px-6 py-2 font-epic">✏️ Sunting</button>
                <button onClick={lenyapkanNaskah} className="bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/30 px-6 py-2 rounded-lg text-sm font-medium transition font-epic">🗑️</button>
              </div>
            </div>

            <div className="prose prose-invert max-w-none text-water-100 leading-loose text-lg whitespace-pre-wrap font-lore relative z-10">
              {naskah.content || <span className="text-water-300/40 italic">Belum ada goresan. Klik Sunting untuk mulai mengukir.</span>}
            </div>

            <div className="mt-10 pt-6 border-t border-water-900/30 flex justify-between text-xs text-water-300/50 font-mono">
              <span>STATUS: {naskah.status}</span>
              <span>TERAKHIR DIPERBARUI: {new Date(naskah.updatedAt || naskah.createdAt).toLocaleDateString('id-ID')}</span>
            </div>
          </div>
        ) : (
          // MODE SUNTING
          <div className="pool-card p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-ancient-300 font-epic">✏️ Sunting Naskah</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm text-water-300/70 mb-2 font-lore">Judul</label>
                  <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-earth-800/50 border border-water-500/30 rounded-lg p-4 text-water-100 focus:ring-2 focus:ring-water-300 outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-water-300/70 mb-2 font-lore">Golongan</label>
                  <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full bg-earth-800/50 border border-water-500/30 rounded-lg p-4 text-water-100">
                    <option>Character</option><option>Nation</option><option>City</option><option>Magic System</option><option>Creature</option><option>Artifact</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-water-300/70 mb-2 font-lore">Isi Naskah</label>
                <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full bg-earth-800/50 border border-water-500/30 rounded-lg p-4 text-water-100 h-80 focus:ring-2 focus:ring-water-300 outline-none font-lore text-base leading-relaxed" />
              </div>
              <div className="flex gap-4 pt-4">
                <button onClick={simpanPerubahan} className="btn-water px-8 py-3 font-epic">💾 Simpan Perubahan</button>
                <button onClick={() => setSedangSunting(false)} className="bg-earth-700 hover:bg-earth-600 text-water-100 px-8 py-3 rounded-lg font-medium transition font-epic">Batal</button>
              </div>
            </div>
          </div>
        )}

        {/* PANEL QUEST AI */}
        {tampilPanelAI && (
          <div className="mt-10 pool-card p-6 border-water-500/50 animate-flow-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-water-300 font-epic">✨ Pertanyaan Penasihat</h2>
              <button onClick={() => setTampilPanelAI(false)} className="text-water-300/50 hover:text-water-300 font-lore">✕ Tutup</button>
            </div>
            {questLoading ? (
              <div className="flex items-center gap-3 text-water-300 py-8 font-lore">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-water-300"></div>
                <span>Penasihat sedang meracik pertanyaan...</span>
              </div>
            ) : questError ? (
              <p className="text-red-400 bg-red-900/20 p-4 rounded-lg font-lore">{questError}</p>
            ) : quest.length > 0 ? (
              <div className="space-y-4">
                {quest.map((q: any, idx: number) => (
                  <div key={idx} className="bg-earth-800/50 border-l-4 border-water-300 p-4 rounded-lg hover:bg-earth-800/80 transition">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <p className="text-water-100 font-medium font-lore">{q.question}</p>
                      <span className={`shrink-0 text-xs px-2 py-1 rounded font-mono ${q.tier === 'BEGINNER' ? 'bg-water-900/50 text-green-300' : q.tier === 'INTERMEDIATE' ? 'bg-water-900/50 text-yellow-300' : 'bg-water-900/50 text-red-300'}`}>{q.tier}</span>
                    </div>
                    {q.hint && <p className="text-water-300/70 text-sm italic font-lore">💡 {q.hint}</p>}
                  </div>
                ))}
                <div className="pt-4"><button onClick={mintaQuestAI} className="text-sm text-water-300 hover:text-water-100 underline font-lore">🔄 Racik Ulang Pertanyaan</button></div>
              </div>
            ) : <p className="text-water-300/50 font-lore">Belum ada pertanyaan.</p>}
          </div>
        )}

        {/* PANEL KONSISTENSI */}
        {tampilKonsistensi && (
          <div className="mt-10 pool-card p-6 border-emerald-500/30 animate-flow-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-emerald-300 font-epic">🔍 Pemeriksaan Konsistensi</h2>
              <button onClick={() => setTampilKonsistensi(false)} className="text-water-300/50 hover:text-water-300 font-lore">✕ Tutup</button>
            </div>
            <p className="text-water-100 mb-4 font-lore">Analisis untuk: <span className="font-semibold text-ancient-300">{naskah.title}</span></p>
            {konsistensiLoading ? (
              <div className="flex items-center gap-3 text-emerald-300 py-4 font-lore">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-400"></div>
                <span>Penasihat sedang menganalisis konsistensi dunia Anda...</span>
              </div>
            ) : konsistensiError ? (
              <p className="text-red-400 bg-red-900/20 p-4 rounded-lg font-lore">{konsistensiError}</p>
            ) : (
              <div className="space-y-4">
                <div className="bg-earth-800/50 p-4 rounded-lg border-l-4 border-emerald-400"><p className="text-water-100 font-medium font-lore">{ringkasanKonsistensi}</p></div>
                {komentarKonsistensi.length > 0 ? (
                  <div className="space-y-3">
                    {komentarKonsistensi.map((comment: any, idx: number) => (
                      <div key={idx} className={`p-4 rounded-lg border-l-4 ${comment.severity === 'high' ? 'bg-red-900/20 border-red-400' : comment.severity === 'medium' ? 'bg-yellow-900/20 border-yellow-400' : 'bg-earth-800/50 border-emerald-400'}`}>
                        <div className="flex justify-between items-start gap-3 mb-1">
                          <span className={`text-xs font-mono px-2 py-0.5 rounded ${comment.type === 'contradiction' ? 'bg-red-900/50 text-red-300' : comment.type === 'timeline' ? 'bg-purple-900/50 text-purple-300' : comment.type === 'motivation' ? 'bg-blue-900/50 text-blue-300' : comment.type === 'world-rule' ? 'bg-cyan-900/50 text-cyan-300' : 'bg-earth-700 text-water-300'}`}>{comment.type.toUpperCase()}</span>
                          <span className={`text-xs ${comment.severity === 'high' ? 'text-red-400' : comment.severity === 'medium' ? 'text-yellow-400' : 'text-emerald-400'}`}>{comment.severity.toUpperCase()}</span>
                        </div>
                        <p className="text-water-100 font-lore">{comment.message}</p>
                        {comment.relatedEntries?.length > 0 && <p className="text-xs text-water-300/50 mt-2 font-lore">Terkait: {comment.relatedEntries.join(', ')}</p>}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-water-300/50 font-lore">Tidak ada isu konsistensi yang terdeteksi.</p>}
                <button onClick={periksaKonsistensi} disabled={konsistensiLoading} className="mt-4 text-sm text-emerald-400 hover:text-emerald-300 underline disabled:opacity-50 font-lore">🔄 Analisis Ulang</button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}