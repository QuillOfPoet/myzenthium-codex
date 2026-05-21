// src/components/Navbar.tsx
'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/', label: 'Beranda', icon: '🏠' },
    { href: '/world', label: 'Khazanah', icon: '📚' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-earth-900/90 backdrop-blur-md border-b border-water-500/20">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          
          {/* Logo - Emoji Water Drop */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-water-300 to-water-700 shadow-[0_0_20px_rgba(77,208,225,0.5)] flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="text-xl">💧</span>
            </div>
            <span className="text-ancient-300 font-epic text-lg tracking-wider drop-shadow-[0_0_8px_rgba(255,213,79,0.5)]">
              Myzenthium
            </span>
          </Link>

          {/* Navigation Items */}
          <div className="flex items-center gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg font-lore transition-all duration-300 flex items-center gap-2 ${
                  pathname === item.href
                    ? 'bg-water-700/30 text-water-300 border border-water-500/50 shadow-[0_0_15px_rgba(77,208,225,0.3)]'
                    : 'text-water-300/60 hover:text-water-300 hover:bg-water-900/20'
                }`}
              >
                <span>{item.icon}</span>
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}