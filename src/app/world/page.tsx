// src/app/world/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function WorldArchive() {
  const router = useRouter()
  
  // Data & Loading
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('All')
  
  // Form Create State
  const [newTitle, setNewTitle] = useState('')
  const [newType, setNewType] = useState('Character')
  const [newContent, setNewContent] = useState('')
  
  // AI Quest State
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  const [quests, setQuests] = useState<any[]>([])
  const [questLoading, setQuestLoading] = useState(false)
  const [questError, setQuestError] = useState('')
  const [questSource, setQuestSource] = useState('') // Menyimpan sumber: 'ai' atau 'mock'

  // 1. Ambil Data
  const fetchEntries = async () => {
    setLoading(true)
    const res = await fetch('/api/entries')
    const data = await res.json()
    if (data.entries) setEntries(data.entries)
    setLoading(false)
  }

  useEffect(() => { fetchEntries() }, [])

  // 2. Simpan Entry Baru
  const handleCreate = async () => {
    if (!newTitle) return alert('Judul tidak boleh kosong!')
    const res = await fetch('/api/entries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, type: newType, content: newContent }),
    })
    if (res.ok) {
      setNewTitle(''); setNewContent(''); setNewType('Character')
      fetchEntries()
    } else {
      alert('Gagal menyimpan')
    }
  }

  // 3. Request AI Quest
  const fetchQuests = async (entry: any) => {
    setQuestLoading(true)
    setQuestError('')
    setQuestSource('') // Reset source
    setSelectedEntry(entry)
    setQuests([])
    
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
      if (data.success) {
        setQuests(data.quests)
        setQuestSource(data.source || 'ai') // Simpan sumber (mock atau ai)
      } else {
        setQuestError(data.error || 'Gagal generate quest')
      }
    } catch (e: any) {
      setQuestError('Error koneksi: ' + e.message)
    } finally {
      setQuestLoading(false)
    }
  }

  // 🔍 LOGIC FILTER
  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (entry.content && entry.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = filterType === 'All' || entry.type === filterType;
    return matchesSearch && matchesType;
  })

  const uniqueTypes = ['All', ...Array.from(new Set(entries.map(e => e.type)))];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        
        {/* HEADER + TOMBOL KEMBALI */}
        <header className="mb-8 text-center">
          <button 
            onClick={() => router.push('/')} 
            className="text-sm text-cyan-400 hover:text-cyan-300 flex items-center gap-1 mx-auto mb-2 transition w-fit"
          >
            ← Kembali ke Dashboard Utama
          </button>
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
            World Archive
          </h1>
          <p className="text-gray-500">Arsip pengetahuan dunia Anda</p>
        </header>

        {/* SEARCH & FILTER BAR */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-8 flex flex-col md:flex-row gap-4 shadow-lg sticky top-4 z-10">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="🔍 Cari entry (Judul atau isi)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none placeholder-gray-500"
            />
          </div>
          <div className="w-full md:w-48">
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
            >
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type === 'All' ? '📂 Semua Tipe' : type}</option>
              ))}
            </select>
          </div>
        </div>

        {/* FORM TAMBAH ENTRY */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-10">
          <h2 className="text-xl font-semibold mb-4 text-gray-300">✨ Tambah Entry Baru</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">Tipe</label>
              <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none">
                <option>Character</option><option>Nation</option><option>City</option>
                <option>Magic System</option><option>Creature</option><option>Artifact</option>
                <option>Religion</option><option>Faction</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Judul</label>
              <input type="text" placeholder="Nama entry..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
          </div>
          <textarea placeholder="Deskripsi singkat atau lore awal..." value={newContent} onChange={(e) => setNewContent(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg p-3 text-white h-24 mb-4 focus:ring-2 focus:ring-purple-500 outline-none" />
          <button onClick={handleCreate} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-lg font-medium transition w-full md:w-auto">
            💾 Simpan Entry
          </button>
        </div>

        {/* DAFTAR ENTRY (FILTERED) */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-gray-400 text-sm">
            <h2 className="text-lg font-semibold text-gray-300">Entries ({filteredEntries.length} / {entries.length})</h2>
          </div>
          
          {loading ? (
            <p className="text-gray-500 text-center py-8">Memuat data dunia...</p>
          ) : (
            <div className="grid gap-4">
              {filteredEntries.map((entry: any) => (
                <div 
                  key={entry.id} 
                  onClick={() => router.push(`/world/${entry.id}`)}
                  className="bg-gray-900 border-l-4 border-purple-500 p-4 rounded-lg hover:bg-gray-800 transition cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-100 group-hover:text-cyan-300 transition">{entry.title}</h3>
                    <span className="text-xs font-mono bg-gray-800 text-purple-400 px-2 py-1 rounded border border-purple-500/20">{entry.type}</span>
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-2 mb-3">{entry.content || 'Belum ada deskripsi...'}</p>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-gray-800">
                    <button 
                      onClick={(e) => { e.stopPropagation(); fetchQuests(entry); }}
                      className="text-xs bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 px-3 py-1.5 rounded border border-purple-500/30 transition"
                    >
                      🤖 Ask AI Mentor
                    </button>
                    <span className="text-xs text-gray-500">{new Date(entry.createdAt).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && filteredEntries.length === 0 && (
            <div className="text-center py-12 text-gray-600 border border-dashed border-gray-800 rounded-lg">
              {searchQuery || filterType !== 'All' ? 'Tidak ada entry yang cocok dengan filter.' : 'Belum ada entry. Mulai bangun duniamu di atas! ⚔️'}
            </div>
          )}
        </div>

        {/* PANEL AI QUEST */}
        {selectedEntry && (
          <div className="mt-12 bg-gradient-to-br from-gray-900 to-purple-900/20 border border-purple-500/30 rounded-xl p-6 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-purple-300">🤖 AI Mentor Quests</h2>
              <button onClick={() => { setSelectedEntry(null); setQuests([]); }} className="text-gray-400 hover:text-white transition">✕ Tutup</button>
            </div>
            
            <p className="text-gray-300 mb-6">
              Quest untuk: <span className="font-semibold text-white">{selectedEntry.title}</span> ({selectedEntry.type})
            </p>

            {questLoading ? (
              <div className="flex items-center gap-3 text-purple-300 py-4">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-400"></div>
                <span>AI sedang meracik pertanyaan...</span>
              </div>
            ) : questError ? (
              <div className="bg-red-900/20 border border-red-500/30 text-red-300 p-4 rounded-lg">⚠️ {questError}</div>
            ) : quests.length > 0 ? (
              <div className="space-y-4">
                
                {/* 🟡 BADGE MOCK WARNING */}
                {questSource && questSource.includes('mock') && (
                  <div className="mb-3 text-xs text-yellow-400 bg-yellow-900/20 px-3 py-1 rounded inline-block border border-yellow-500/30">
                    ⚠️ Menggunakan Mock Quest. Cek API Key di Vercel settings.
                  </div>
                )}

                {quests.map((quest: any, idx: number) => (
                  <div key={idx} className="bg-gray-800/50 border-l-4 border-cyan-400 p-4 rounded-lg">
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <p className="text-gray-100 font-medium">{quest.question}</p>
                      <span className={`shrink-0 text-xs px-2 py-1 rounded font-mono ${
                        quest.tier === 'BEGINNER' ? 'bg-green-900/50 text-green-300 border border-green-500/30' :
                        quest.tier === 'INTERMEDIATE' ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30' :
                        'bg-red-900/50 text-red-300 border border-red-500/30'
                      }`}>{quest.tier}</span>
                    </div>
                    {quest.hint && <p className="text-gray-400 text-sm italic mt-1">💡 {quest.hint}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Belum ada quest. Klik tombol di atas untuk generate.</p>
            )}

            <button onClick={() => fetchQuests(selectedEntry)} disabled={questLoading} className="mt-6 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-medium transition w-full md:w-auto">
              {questLoading ? '⏳ Memproses...' : '✨ Generate Quest Baru'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}