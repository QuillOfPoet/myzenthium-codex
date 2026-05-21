// src/components/CursorLight.tsx
'use client'
import { useEffect } from 'react'

export default function CursorLight() {
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Track posisi mouse untuk efek kartu
      const cards = Array.from(document.querySelectorAll('.pool-card')) as HTMLElement[]
      cards.forEach(card => {
        const rect = card.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 100
        
        card.style.setProperty('--mouse-x', `${x}%`)
        card.style.setProperty('--mouse-y', `${y}%`)
      })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return null
}