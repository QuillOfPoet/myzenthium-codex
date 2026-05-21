// src/app/world/page.tsx - Khazanah Dunia
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function WorldArchive() {
  const router = useRouter()
  
  const [naskah, setNaskah] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [judulBaru, setJudulBaru] = useState('')
  const [tipeBaru, setTipeBaru] = useState('Character')
  const [kontenBaru, setKontenBaru] = useState('')
  const [naskahTerpilih, setNaskahTerpilih] = useState<any>(null)
  const [quest, setQuest] = useState<any[]>([])
  const [questLoading, setQuestLoading] = useState(false)
  const [questError, setQuestError] = useState('')

  const ambilNaskah = async () => {
    setLoading(true)
    const res = await fetch('/api/entries')
    const data = await res.json()
    if (data.entries) setNaskah(data.entries)
    setLoading(false)
  }

  useEffect(() => { ambilNaskah() }, [])

  const abadikanKisah = async () => {
    if (!judulBaru) return alert('Judul tidak boleh kosong!')
    
    // Efek blessing saat submit
    const formElement = document.querySelector('.form-ukir-kisah')
    formElement?.classList.add('blessing-active')
    setTimeout(() => formElement?.classList.remove('blessing-active'), 1200)

    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: judulBaru, type: tipeBaru, content: kontenBaru }),
    })
    if (res.ok) {
      setJudulBaru(''); setKontenBaru(''); setTipeBaru('Character')
      ambilNaskah()
    } else {
      alert('Gagal mengabadikan')
    }
  }

  const mintaQuest = async (entry: any) => {
    setQuestLoading(true)
    setQuestError('')
    setNaskahTerpilih(entry)
    setQuest([])
    
    try {
      const res = await fetch('/api/ai/quest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryContext: { type: entry.type, title: entry.title, content: entry.content, tags: entry.tags, status: entry.status },
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

  const naskahTersaring = naskah.filter(entry => {
    const cocokCari = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                      (entry.content && entry.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const cocokTipe = filterType === 'All' || entry.type === filterType;
    return cocokCari && cocokTipe;
  })

  return (
    <div className="min-h-screen p-4 md:p-7">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-12 text-center animate-flow-in pt-6">
          <h1 className="text-5xl md:text-6xl font-bold mb-4 font-epic text-ancient-300 drop-shadow-[0_0_10px_rgba(255,213,79,0.5)] text-shimmer">
            Khazanah Dunia
          </h1>
          <p className="text-water-300 text-lg font-lore">Arsip kisah dan legenda dunia Anda</p>
        </header>

        {/* SEARCH & FILTER */}
        <div className="pool-card p-6 mb-10 animate-flow-in">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <label className="block text-sm text-water-300/70 mb-2 font-lore">🔍 Telusuri Khazanah</label>
              <input 
                type="text" 
                placeholder="Cari nama kisah atau isi goresan..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-earth-800/50 border border-water-500/30 rounded-lg p-3 pl-10 text-water-100 placeholder-water-500/50 focus:ring-2 focus:ring-water-300 outline-none transition"
              />
            </div>
            <div className="w-full md:w-56">
              <label className="block text-sm text-water-300/70 mb-2 font-lore tracking-wide">📂 Saring Golongan</label>
              <div className="relative">
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-earth-800/50 border border-water-500/30 rounded-lg p-3 pr-10 text-water-100 focus:ring-2 focus:ring-water-300 outline-none appearance-none cursor-pointer hover:border-water-300/50 transition"
                >
                  <option value="All" className="bg-earth-900 text-water-300">📜 Semua Golongan</option>
                  <option value="Character" className="bg-earth-900 text-water-300">👤 Tokoh</option>
                  <option value="Nation" className="bg-earth-900 text-water-300">🏰 Kerajaan</option>
                  <option value="City" className="bg-earth-900 text-water-300">🏙️ Kota</option>
                  <option value="Magic System" className="bg-earth-900 text-water-300">✨ Sihir</option>
                  <option value="Creature" className="bg-earth-900 text-water-300">🐉 Makhluk</option>
                  <option value="Artifact" className="bg-earth-900 text-water-300">💎 Artefak</option>
                  <option value="Religion" className="bg-earth-900 text-water-300">⛪ Kepercayaan</option>
                  <option value="Faction" className="bg-earth-900 text-water-300">⚔️ Faksi</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* FORM UKIR KISAH BARU - FIXED STRUCTURE */}
        <div className="pool-card p-6 mb-10 animate-flow-in form-ukir-kisah">
          <h2 className="text-xl font-semibold mb-6 text-ancient-300 font-epic flex items-center gap-2">
            <span>✨</span><span>Ukir Kisah Baru</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm text-water-300/70 mb-2 font-lore">Golongan</label>
              <div className="relative">
                <select 
                  value={tipeBaru} 
                  onChange={(e) => setTipeBaru(e.target.value)} 
                  className="w-full bg-earth-800/50 border border-water-500/30 rounded-lg p-3 pr-10 text-water-100 focus:ring-2 focus:ring-water-300 outline-none appearance-none cursor-pointer hover:border-water-300/50 transition"
                >
                  <option value="Character" className="bg-earth-900 text-water-300">👤 Tokoh</option>
                  <option value="Nation" className="bg-earth-900 text-water-300">🏰 Kerajaan</option>
                  <option value="City" className="bg-earth-900 text-water-300">🏙️ Kota</option>
                  <option value="Magic System" className="bg-earth-900 text-water-300">✨ Sihir</option>
                  <option value="Creature" className="bg-earth-900 text-water-300">🐉 Makhluk</option>
                  <option value="Artifact" className="bg-earth-900 text-water-300">💎 Artefak</option>
                  <option value="Religion" className="bg-earth-900 text-water-300">⛪ Kepercayaan</option>
                  <option value="Faction" className="bg-earth-900 text-water-300">⚔️ Faksi</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-water-300/70 mb-2 font-lore">Judul Kisah</label>
              <input 
                type="text" 
                placeholder="Nama yang akan diabadikan..." 
                value={judulBaru} 
                onChange={(e) => setJudulBaru(e.target.value)} 
                className="w-full bg-earth-800/50 border border-water-500/30 rounded-lg p-3 text-water-100 placeholder-water-500/50 focus:ring-2 focus:ring-water-300 outline-none transition"
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm text-water-300/70 mb-2 font-lore">Goresan Awal</label>
            <textarea 
              placeholder="Mulai goreskan kisah ini di sini..." 
              value={kontenBaru} 
              onChange={(e) => setKontenBaru(e.target.value)} 
              className="w-full bg-earth-800/50 border border-water-500/30 rounded-lg p-4 text-water-100 placeholder-water-500/50 h-32 focus:ring-2 focus:ring-water-300 outline-none font-lore resize-none"
            />
          </div>
          <button onClick={abadikanKisah} className="btn-water w-full md:w-auto font-epic tracking-wide">
            💾 Abadikan Kisah
          </button>
        </div>

        {/* DAFTAR NASKAH */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-water-300/70 text-sm">
            <h2 className="text-lg font-semibold font-epic text-ancient-300">Kisah yang Terabadi ({naskahTersaring.length} / {naskah.length})</h2>
          </div>
          {loading ? (
            <p className="text-water-300/70 text-center py-8 font-lore">Memuat khazanah dunia...</p>
          ) : (
            <div className="grid gap-4">
              {naskahTersaring.map((entry: any) => (
                <div 
                  key={entry.id} 
                  onClick={() => router.push(`/world/${entry.id}`)}
                  className="pool-card p-4 cursor-pointer animate-flow-in group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-water-100 group-hover:text-water-300 transition font-epic">{entry.title}</h3>
                    <span className="text-xs font-mono bg-water-900/50 text-water-300 px-2 py-1 rounded border border-water-500/30">{entry.type}</span>
                  </div>
                  <p className="text-water-300/70 text-sm line-clamp-2 mb-3 font-lore">{entry.content || 'Belum ada goresan...'}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-water-900/30">
                    <button 
                      onClick={(e) => { e.stopPropagation(); mintaQuest(entry); }}
                      className="btn-water text-xs px-3 py-1.5 font-epic btn-ai-sparkle"
                    >
                      🤖 Tanya Penasihat
                    </button>
                    <span className="text-xs text-water-300/50 font-lore">{new Date(entry.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!loading && naskahTersaring.length === 0 && (
            <div className="pool-card p-12 text-center text-water-300/50 border-dashed font-lore">
              {searchQuery || filterType !== 'All' ? 'Tak ada kisah yang cocok dengan pencarian.' : 'Khazanah masih kosong. Mulai ukir kisah pertamamu! ⚔️'}
            </div>
          )}
        </div>

        {/* PANEL QUEST AI */}
        {naskahTerpilih && (
          <div className="mt-12 pool-card p-6 border-water-500/50 animate-flow-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-water-300 font-epic">🤖 Pertanyaan Penasihat</h2>
              <button onClick={() => { setNaskahTerpilih(null); setQuest([]); }} className="text-water-300/50 hover:text-water-300 transition font-lore">✕ Tutup</button>
            </div>
            <p className="text-water-100 mb-6 font-lore">
              Pertanyaan untuk: <span className="font-semibold text-ancient-300">{naskahTerpilih.title}</span> ({naskahTerpilih.type})
            </p>
            {questLoading ? (
              <div className="flex items-center gap-3 text-water-300 py-4 font-lore">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-water-300"></div>
                <span>Penasihat sedang meracik pertanyaan...</span>
              </div>
            ) : questError ? (
              <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-lg font-lore">⚠️ {questError}</div>
            ) : quest.length > 0 ? (
              <div className="space-y-4">
                {quest.map((q: any, idx: number) => (
                  <div key={idx} className="bg-earth-800/50 border-l-4 border-water-300 p-4 rounded-lg">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <p className="text-water-100 font-medium font-lore">{q.question}</p>
                      <span className={`shrink-0 text-xs px-2 py-1 rounded font-mono ${
                        q.tier === 'BEGINNER' ? 'bg-water-900/50 text-green-300 border border-green-500/30' :
                        q.tier === 'INTERMEDIATE' ? 'bg-water-900/50 text-yellow-300 border border-yellow-500/30' :
                        'bg-water-900/50 text-red-300 border border-red-500/30'
                      }`}>{q.tier}</span>
                    </div>
                    {q.hint && <p className="text-water-300/70 text-sm italic mt-1 font-lore">💡 {q.hint}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-water-300/50 font-lore">Belum ada pertanyaan. Klik tombol di atas untuk meminta.</p>
            )}
            <button onClick={() => mintaQuest(naskahTerpilih)} disabled={questLoading} className="mt-6 btn-water w-full md:w-auto font-epic">
              {questLoading ? '⏳ Meracik...' : '✨ Racik Pertanyaan Baru'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}