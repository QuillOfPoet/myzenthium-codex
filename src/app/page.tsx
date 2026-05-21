// src/app/page.tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 pb-4 border-b border-gray-800">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
            MyzenthiumCodex
          </h1>
          <p className="text-gray-400 mt-1">Creative Intelligence Augmentation for Worldbuilders</p>
        </header>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="text-sm text-gray-500">World Entries</div>
            <div className="text-2xl font-bold text-purple-400">0</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="text-sm text-gray-500">Active Drafts</div>
            <div className="text-2xl font-bold text-cyan-400">0</div>
          </div>
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
            <div className="text-sm text-gray-500">AI Quests</div>
            <div className="text-2xl font-bold text-emerald-400">0</div>
          </div>
        </div>

        {/* Tombol Menuju World Archive (BARU) */}
        <div className="mt-6 mb-10">
          <a 
            href="/world" 
            className="inline-block bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white px-6 py-3 rounded-lg font-bold transition shadow-lg shadow-purple-900/20"
          >
            Masuk ke World Archive →
          </a>
        </div>

        {/* Placeholder Panel */}
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
          <h2 className="text-lg font-semibold mb-3">🚧 Under Construction</h2>
          <p className="text-gray-400 text-sm">
            Database terhubung. Layout dasar siap. Selanjutnya: AI Quest Engine & Consistency Checker.
          </p>
          <div className="mt-4 p-3 bg-gray-800 rounded text-xs text-gray-300 font-mono">
            Status: Phase 2A ✓ | Next: World Archive CRUD
          </div>
        </div>
      </div>
    </main>
  )
}