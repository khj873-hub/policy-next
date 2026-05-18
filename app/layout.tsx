import type { Metadata } from 'next'
import '@/styles/global.css'
import SessionWrapper from '@/components/SessionWrapper'

export const metadata: Metadata = {
  title: '퍼펙트 정부지원정책 | AI 맞춤 정책자금 매칭',
  description: '자연어로 묻기만 하면 AI가 맞춤 공고부터 사업계획서 초안까지 한 번에 완성합니다.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body style={{ margin: 0, padding: 0, background: '#0F0F1E' }}>
        <SessionWrapper>{children}</SessionWrapper>
      </body>
    </html>
  )
}
