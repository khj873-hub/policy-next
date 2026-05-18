'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { S } from '@/lib/styles'

const FORM_FIELDS = [
  { key: 'region',   label: '지역', icon: '📍', ph: '예: 서울시 강남구' },
  { key: 'industry', label: '업종', icon: '💼', ph: '예: IT 서비스, 제조업' },
  { key: 'age',      label: '업력', icon: '📅', ph: '예: 창업 3년차, 예비창업' },
] as const

export default function ProfilePage() {
  const router = useRouter()
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
          <div style={S.profileHero}>
            <div style={S.profileAvatar}>
              <span style={{ fontSize: 32 }}>👤</span>
            </div>
            <p style={S.profileDesc}>프로필을 저장하면 AI가<br />더 정확한 맞춤 공고를 추천합니다</p>
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
