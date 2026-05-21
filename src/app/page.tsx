// src/app/page.tsx - Beranda MyzenthiumCodex
'use client'
import { useRouter } from 'next/navigation'
<div className="mb-8">
  <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-water-300 to-water-700 shadow-[0_0_40px_rgba(77,208,225,0.6)] flex items-center justify-center mb-6">
    <span className="text-4xl">💧</span>
  </div>
  <div className="absolute inset-0 bg-gradient-to-t from-earth-900 via-transparent to-transparent"></div>
</div>
export default function Home() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(77,208,225,0.1),transparent_70%)]"></div>
      </div>

      <div className="relative z-10 text-center max-w-3xl mx-auto animate-flow-in">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-water-300 to-water-700 shadow-[0_0_40px_rgba(77,208,225,0.6)] flex items-center justify-center mb-6">
            <span className="text-4xl">💧</span>
          </div>
        </div>

        <h1 className="text-6xl md:text-7xl font-bold mb-4 font-epic text-ancient-300 drop-shadow-[0_0_20px_rgba(255,213,79,0.6)]">
          Myzenthium Codex
        </h1>
        
        <p className="text-xl md:text-2xl text-water-300/80 mb-3 font-lore italic">
          "Di tanah yang kering, air adalah legenda"
        </p>
        
        <p className="text-water-300/60 mb-12 font-lore">
          Abadikan kisah-kisah dunia Anda dalam khazanah abadi
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button 
            onClick={() => router.push('/world')}
            className="btn-water px-8 py-4 text-lg font-epic tracking-wider"
          >
            📜 Masuk ke Khazanah Dunia
          </button>
          
          <button 
            onClick={() => router.push('/world')}
            className="px-8 py-4 text-lg font-epic tracking-wider border-2 border-water-500/50 text-water-300 rounded-lg hover:bg-water-900/30 hover:border-water-300 transition-all duration-300"
          >
            ✨ Mulai Kisah Baru
          </button>
        </div>

        <div className="mt-16 pt-8 border-t border-water-900/30">
          <p className="text-sm text-water-300/40 font-lore">
            Di bawah naungan Dewi Aumithia, setiap kisah adalah air yang menghidupkan
          </p>
        </div>
      </div>
    </div>
  )
}