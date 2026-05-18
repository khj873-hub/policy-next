'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signIn, signOut } from 'next-auth/react'
import { useStore } from '@/lib/store'
import { S } from '@/lib/styles'

const FORM_FIELDS = [
  { key: 'region',   label: '지역', icon: '📍', ph: '예: 서울시 강남구' },
  { key: 'industry', label: '업종', icon: '💼', ph: '예: IT 서비스, 제조업' },
  { key: 'age',      label: '업력', icon: '📅', ph: '예: 창업 3년차, 예비창업' },
] as const

export default function ProfilePage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { profile, setProfile, saveProfile, loadProfile } = useStore()

  useEffect(() => { loadProfile() }, [])

  const handleSave = () => {
    saveProfile(profile)
    router.push('/')
  }

  return (
    <div style={S.root}>
      <div style={S.bgGradient} />
      <div style={S.bgGrain} />
      <div style={S.page}>
        <header style={S.header}>
          <button style={S.backBtn} onClick={() => router.back()}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <span style={S.profileHeaderTitle}>내 프로필</span>
          <div style={{ width: 40 }} />
        </header>

        <div style={S.homeScroll}>
          {/* 구글 로그인 섹션 */}
          <div style={S.googleSection}>
            {status === 'loading' ? (
              <div style={S.googleLoading}>로딩 중...</div>
            ) : session ? (
              <div style={S.googleProfile}>
                {session.user?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="avatar" style={S.googleAvatar} />
                )}
                <div style={S.googleInfo}>
                  <div style={S.googleName}>{session.user?.name}</div>
                  <div style={S.googleEmail}>{session.user?.email}</div>
                </div>
                <button style={S.googleSignOutBtn} onClick={() => signOut()}>로그아웃</button>
              </div>
            ) : (
              <div style={S.googleLoginWrap}>
                <p style={S.googleLoginDesc}>Google 계정으로 로그인하면<br />기기 간 프로필이 동기화됩니다</p>
                <button style={S.googleLoginBtn} onClick={() => signIn('google')}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google로 계속하기
                </button>
              </div>
            )}
          </div>

          <div style={S.formCard}>
            {FORM_FIELDS.map((f) => (
              <div key={f.key} style={S.formGroup}>
                <label style={S.formLabel}>
                  <span style={S.formLabelIcon}>{f.icon}</span>
                  <span>{f.label}</span>
                </label>
                <input style={S.formInput} placeholder={f.ph}
                  value={profile[f.key]}
                  onChange={(e) => setProfile({ ...profile, [f.key]: e.target.value })} />
              </div>
            ))}
            <button style={S.saveBtn} onClick={handleSave}>
              <span>프로필 저장</span>
              <span style={S.searchBtnArrow}>→</span>
            </button>
          </div>

          <div style={S.principleWrap}>
            <h3 style={S.principleTitle}>운영 원칙</h3>
            {[
              { icon: '🔒', t: 'API 보안',     d: '모든 AI 호출은 서버에서 처리' },
              { icon: '🛡', t: 'LLM 역할 제한', d: '공고 생성·자격 결정 불가' },
              { icon: '📋', t: '실제 데이터',   d: '공공 데이터 기반 (가상 공고 없음)' },
              { icon: '⚠️', t: '법적 고지',     d: '최종 판단은 주관기관 기준' },
            ].map((p) => (
              <div key={p.t} style={S.principleCard}>
                <div style={S.principleIconBox}><span>{p.icon}</span></div>
                <div>
                  <div style={S.principleCardTitle}>{p.t}</div>
                  <div style={S.principleCardDesc}>{p.d}</div>
                </div>
              </div>
            ))}
            <div style={{ height: 40 }} />
          </div>
        </div>
      </div>
    </div>
  )
}
