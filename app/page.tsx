'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { S } from '@/lib/styles'
import { EXAMPLE_QUERIES, DEADLINE_LIST } from '@/lib/constants'

export default function HomePage() {
  const router = useRouter()
  const { input, setInput, savedProfile, loadProfile, setMessages, setChatLoading } = useStore()
  const hasProfile = savedProfile.region || savedProfile.industry || savedProfile.age

  useEffect(() => { loadProfile() }, [])

  const startChat = async (query: string) => {
    if (!query.trim()) return
    setMessages([{ role: 'user', content: query }])
    setInput('')
    router.push('/chat?q=' + encodeURIComponent(query))
  }

  return (
    <div style={S.root}>
      <style>{''}</style>
      <div style={S.bgGradient} />
      <div style={S.bgGrain} />
      <div style={S.page}>
        <header style={S.header}>
          <div style={S.logoWrap}>
            <div style={S.logoBadge}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L4 6V12C4 17 7 21 12 22C17 21 20 17 20 12V6L12 2Z" fill="url(#gradLogo)" />
                <path d="M8 12L11 15L16 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="gradLogo" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#A855F7" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <div style={S.logoName}>퍼펙트 <span style={S.logoNameAccent}>정부지원정책</span></div>
              <div style={S.logoSub}>AI POLICY CONSULTANT</div>
            </div>
          </div>
          <button style={S.profileBtn} onClick={() => router.push('/profile')}>
            <span style={{ fontSize: 16 }}>👤</span>
            {hasProfile && <span style={S.profileDot} />}
          </button>
        </header>

        <div style={S.homeScroll}>
          <div style={S.hero}>
            <div style={S.heroLabel}>
              <span style={S.heroLabelDot} />
              AI 기반 맞춤 정책자금 매칭
            </div>
            <h1 style={S.heroTitle}>
              정책자금,<br />
              <span style={S.heroTitleGrad}>대화로 찾아드려요</span>
            </h1>
            <p style={S.heroDesc}>
              자연어로 묻기만 하면, AI가 맞춤 공고부터<br />
              사업계획서 초안까지 한 번에 완성합니다.
            </p>
          </div>

          <div style={S.searchCard}>
            <div style={S.searchInner}>
              <textarea
                style={S.searchInput}
                placeholder="예: 서울 IT 창업 2년차, 사업화 자금이 필요해요"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); startChat(input) } }}
                rows={2}
              />
              <button
                style={{ ...S.searchBtn, opacity: input.trim() ? 1 : 0.4 }}
                onClick={() => startChat(input)} disabled={!input.trim()}
              >
                <span>AI 컨설팅 시작</span>
                <span style={S.searchBtnArrow}>→</span>
              </button>
            </div>
            <div style={S.exampleScroll}>
              {EXAMPLE_QUERIES.map((q, i) => (
                <button key={q} style={S.exampleChip} onClick={() => startChat(q)}>
                  <span style={S.exampleNum}>0{i + 1}</span>
                  <span style={S.exampleText}>{q}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={S.section}>
            <div style={S.sectionHead}>
              <div>
                <div style={S.sectionLabel}>URGENT</div>
                <h2 style={S.sectionTitle}>
                  <span style={S.fireEmoji}>🔥</span> 마감 임박 공고
                </h2>
              </div>
              <span style={S.sectionCount}>{DEADLINE_LIST.length}건</span>
            </div>
            <div style={S.deadlineGrid}>
              {DEADLINE_LIST.map((item, i) => (
                <button key={i} style={S.deadlineCard}
                  onClick={() => startChat(`${item.title} 자격 조건이랑 신청 방법 알려줘`)}>
                  <div style={S.deadlineTop}>
                    <div style={{
                      ...S.ddayBadge,
                      background: item.dday <= 7 ? 'linear-gradient(135deg, #FF4D6D, #FF8C42)' : 'linear-gradient(135deg, #FFB800, #FF8C42)',
                    }}>D-{item.dday}</div>
                    <span style={S.deadlineRegion}>{item.region}</span>
                  </div>
                  <div style={S.deadlineTitle}>{item.title}</div>
                  <div style={S.deadlineBottom}>
                    <span style={S.deadlineAmount}>💰 {item.amount}</span>
                    <span style={S.deadlineArrow}>→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={S.section}>
            <h2 style={S.sectionTitle}>주요 기능</h2>
            <div style={S.featureGrid}>
              {[
                { icon: '🔍', title: '자연어 검색', desc: '조건 자동 추출' },
                { icon: '🤖', title: '맞춤 추천', desc: '프로필 기반 매칭' },
                { icon: '📝', title: 'AI 사업계획서', desc: '6섹션 초안 생성' },
                { icon: '🛡', title: '자격 사전 확인', desc: '신청 전 체크' },
              ].map((f) => (
                <div key={f.title} style={S.featureCard}>
                  <div style={S.featureIconWrap}>
                    <span style={S.featureIcon}>{f.icon}</span>
                  </div>
                  <div style={S.featureTitle}>{f.title}</div>
                  <div style={S.featureDesc}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={S.disclaimer}>
            <span style={S.disclaimerIcon}>ⓘ</span>
            AI 답변은 참고용입니다. 실제 선정은 주관기관 심사에 따릅니다.
          </div>
        </div>
      </div>
    </div>
  )
}
