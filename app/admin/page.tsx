'use client'
import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

type Stats = { totalUsers: number; totalChats: number; totalPlans: number; todayUsers: number; todayChats: number }
type User = { id: string; email: string; name: string; avatar: string; region: string; industry: string; age: string; created_at: string; last_seen_at: string }
type Chat = { id: string; user_email: string; question: string; answer: string; created_at: string }
type Plan = { id: string; user_email: string; program: string; problem: string; target_customer: string; goal: string; created_at: string }

const C = {
  root: { minHeight: '100vh', background: '#0F0F1A', color: '#E2E8F0', fontFamily: 'system-ui, sans-serif' },
  header: { background: '#1A1A2E', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: 800, background: 'linear-gradient(120deg,#6366F1,#A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' },
  nav: { display: 'flex', gap: 4, padding: '16px 24px 0' },
  navBtn: (active: boolean): React.CSSProperties => ({
    padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    background: active ? 'rgba(99,102,241,0.2)' : 'transparent',
    color: active ? '#A5B4FC' : '#64748B',
    borderBottom: active ? '2px solid #6366F1' : '2px solid transparent',
  }),
  body: { padding: 24 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 12, marginBottom: 24 },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16 },
  cardLabel: { fontSize: 11, color: '#64748B', fontWeight: 600, marginBottom: 6, letterSpacing: '0.08em' },
  cardValue: { fontSize: 28, fontWeight: 800, color: '#F1F5F9' },
  cardSub: { fontSize: 11, color: '#10B981', marginTop: 2 },
  table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 },
  th: { textAlign: 'left' as const, padding: '10px 12px', color: '#64748B', fontWeight: 600, borderBottom: '1px solid rgba(255,255,255,0.07)', fontSize: 11, letterSpacing: '0.05em' },
  td: { padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.05)', verticalAlign: 'top' as const },
  tag: { display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: 'rgba(99,102,241,0.15)', color: '#A5B4FC' },
  expand: { background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', fontSize: 12, padding: '2px 6px' },
  loginWrap: { display: 'flex', flexDirection: 'column' as const, alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16 },
  loginBtn: { padding: '12px 24px', background: 'linear-gradient(135deg,#6366F1,#A855F7)', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer' },
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<'dashboard' | 'users' | 'chats' | 'plans'>('dashboard')
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [chats, setChats] = useState<Chat[]>([])
  const [plans, setPlans] = useState<Plan[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin

  useEffect(() => {
    if (!isAdmin) return
    fetch(`/api/admin/stats?tab=${tab}`)
      .then(r => r.json())
      .then(d => {
        if (tab === 'dashboard') setStats(d)
        if (tab === 'users') setUsers(d.data || [])
        if (tab === 'chats') setChats(d.data || [])
        if (tab === 'plans') setPlans(d.data || [])
      })
  }, [tab, isAdmin])

  if (status === 'loading') return <div style={C.loginWrap}><p style={{ color: '#64748B' }}>로딩 중...</p></div>

  if (!session) return (
    <div style={C.loginWrap}>
      <p style={{ color: '#94A3B8' }}>관리자 로그인이 필요합니다</p>
      <button style={C.loginBtn} onClick={() => signIn('google')}>Google로 로그인</button>
    </div>
  )

  if (!isAdmin) return (
    <div style={C.loginWrap}>
      <p style={{ color: '#F87171' }}>접근 권한이 없습니다</p>
      <button style={{ ...C.loginBtn, background: '#334155' }} onClick={() => router.push('/')}>홈으로</button>
    </div>
  )

  return (
    <div style={C.root}>
      <div style={C.header}>
        <span style={C.title}>⚙️ 관리자 대시보드</span>
        <span style={{ fontSize: 13, color: '#64748B' }}>{session.user?.email}</span>
      </div>

      <div style={C.nav}>
        {(['dashboard', 'users', 'chats', 'plans'] as const).map(t => (
          <button key={t} style={C.navBtn(tab === t)} onClick={() => setTab(t)}>
            {{ dashboard: '📊 대시보드', users: '👥 가입이력', chats: '💬 채팅이력', plans: '📄 사업계획서' }[t]}
          </button>
        ))}
      </div>

      <div style={C.body}>
        {tab === 'dashboard' && stats && (
          <div style={C.grid}>
            {[
              { label: '총 가입자', value: stats.totalUsers, sub: `오늘 +${stats.todayUsers}` },
              { label: '총 채팅', value: stats.totalChats, sub: `오늘 ${stats.todayChats}건` },
              { label: '사업계획서 생성', value: stats.totalPlans, sub: '누적' },
            ].map(s => (
              <div key={s.label} style={C.card}>
                <div style={C.cardLabel}>{s.label}</div>
                <div style={C.cardValue}>{s.value ?? 0}</div>
                <div style={C.cardSub}>{s.sub}</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'users' && (
          <table style={C.table}>
            <thead><tr>
              {['이름', '이메일', '지역', '업종', '업력', '가입일', '마지막 접속'].map(h => <th key={h} style={C.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={C.td}>{u.name || '-'}</td>
                  <td style={C.td}>{u.email}</td>
                  <td style={C.td}>{u.region || '-'}</td>
                  <td style={C.td}>{u.industry || '-'}</td>
                  <td style={C.td}>{u.age || '-'}</td>
                  <td style={C.td}>{u.created_at?.slice(0, 10)}</td>
                  <td style={C.td}>{u.last_seen_at?.slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'chats' && (
          <table style={C.table}>
            <thead><tr>
              {['사용자', '질문', '답변', '일시'].map(h => <th key={h} style={C.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {chats.map(c => (
                <tr key={c.id}>
                  <td style={{ ...C.td, whiteSpace: 'nowrap' }}>{c.user_email || '비로그인'}</td>
                  <td style={{ ...C.td, maxWidth: 200 }}>{c.question}</td>
                  <td style={{ ...C.td, maxWidth: 300 }}>
                    {expanded === c.id ? c.answer : c.answer.slice(0, 80) + (c.answer.length > 80 ? '...' : '')}
                    {c.answer.length > 80 && (
                      <button style={C.expand} onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
                        {expanded === c.id ? '접기' : '더보기'}
                      </button>
                    )}
                  </td>
                  <td style={{ ...C.td, whiteSpace: 'nowrap' }}>{c.created_at?.slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'plans' && (
          <table style={C.table}>
            <thead><tr>
              {['사용자', '지원사업', '문제', '목표 고객', '목표', '일시'].map(h => <th key={h} style={C.th}>{h}</th>)}
            </tr></thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.id}>
                  <td style={{ ...C.td, whiteSpace: 'nowrap' }}>{p.user_email || '비로그인'}</td>
                  <td style={{ ...C.td, maxWidth: 180 }}><span style={C.tag}>{p.program}</span></td>
                  <td style={{ ...C.td, maxWidth: 160 }}>{p.problem}</td>
                  <td style={{ ...C.td, maxWidth: 140 }}>{p.target_customer}</td>
                  <td style={{ ...C.td, maxWidth: 140 }}>{p.goal}</td>
                  <td style={{ ...C.td, whiteSpace: 'nowrap' }}>{p.created_at?.slice(0, 16).replace('T', ' ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
