'use client'
import { S } from '@/lib/styles'

export default function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 18, animation: 'fadeUp 0.3s ease' }}>
      <div style={S.avatarAI}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 6V12C4 17 7 21 12 22C17 21 20 17 20 12V6L12 2Z" fill="#fff" />
        </svg>
      </div>
      <div style={{ ...S.aiBubble, display: 'flex', gap: 6, alignItems: 'center', padding: '14px 18px' }}>
        {[0, 0.15, 0.3].map((d, i) => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366F1, #A855F7)',
            display: 'inline-block',
            animation: `bounce 1.2s ${d}s infinite ease-in-out`,
          }} />
        ))}
      </div>
    </div>
  )
}
