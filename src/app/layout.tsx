// src/app/layout.tsx
import './globals.css'
import Navbar from '@/components/Navbar'
import CursorLight from '@/components/CursorLight'

export const metadata = {
  title: 'Myzenthium Codex',
  description: 'Di tanah yang kering, air adalah legenda',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className="antialiased">
        <CursorLight />
        <Navbar />
        <main className="pt-24 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
