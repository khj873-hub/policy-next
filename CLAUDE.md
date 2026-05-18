# 퍼펙트 정부지원정책 — CLAUDE.md

## 프로젝트 개요
정부지원사업을 자연어로 검색하고 AI가 맞춤 추천 → 아이디어 수집 → 사업계획서 초안까지
한 세션에서 완성하는 모바일 웹 서비스. **AI 채팅 컨설팅 + 사업계획서 자동 생성이 핵심 차별점**.

## 핵심 유저 여정
```
홈 자연어 입력
  → 채팅: AI 공고 추천
  → 관심 공고 감지 시 "사업계획서 작성" 버튼 자동 노출
  → 아이디어 수집 3단계 (문제 / 고객 / 목표)
  → 사업계획서 패널 슬라이드업 + 6섹션 초안 자동 생성
  → 복사 → 실제 신청서 활용
```

## 현재 상태
- **policy-next-v4.jsx** 에 전체 UI/UX + 인터랙션 로직 + AI 프롬프트 완성됨
- 디자인 작업 완료 (premium fintech, 글래스모피즘, 그라데이션, 마이크로 인터랙션)
- **Claude Code가 할 일: Next.js 구조 분리 + API 라우트 보안 + 배포**

## 기술 스택
- Framework: Next.js 14 (App Router)
- 언어: TypeScript
- 스타일: 인라인 스타일 객체 (S 객체) 그대로 유지 — Tailwind 변환 금지
- AI: Anthropic Claude API (claude-sonnet-4-20250514)
- 상태: Zustand (또는 Context)
- 영속성: localStorage (프로필 저장)
- 배포: Vercel

## Claude Code 작업 범위 (우선순위 순)

### 1. Next.js 프로젝트 구조 분리
policy-next-v4.jsx의 단일 컴포넌트를 다음 구조로 분리:
```
/app
  /api
    /chat/route.ts          ← 채팅 AI 호출 (서버 전용, API 키 보호)
    /plan/route.ts          ← 사업계획서 AI 호출 (서버 전용, API 키 보호)
  /page.tsx                 ← 홈 화면
  /chat/page.tsx            ← 채팅 + 아이디어 수집 + 사업계획서 패널
  /profile/page.tsx         ← 프로필
  /layout.tsx               ← 루트 레이아웃 (글로벌 CSS 주입)
/components
  MessageBubble.tsx
  TypingIndicator.tsx
  PlanPanel.tsx             ← 사업계획서 슬라이드업 패널
  DeadlineCard.tsx
  Header.tsx
  ProgressBar.tsx           ← 아이디어 수집 진행 바
/lib
  prompts.ts                ← buildChatPrompt / buildPlanPrompt
  store.ts                  ← Zustand 스토어 (profile, messages, ideaPhase 등)
  types.ts
  constants.ts              ← EXAMPLE_QUERIES, DEADLINE_LIST, IDEA_QUESTIONS
/styles
  global.css                ← @keyframes 등 글로벌 애니메이션
```

### 2. API 라우트 분리 (보안 필수)
**현재 코드는 클라이언트에서 직접 Anthropic API 호출 → API 키 노출 위험.**
반드시 서버 라우트로 분리:

```typescript
// /app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages, profile, ideaContext } = await req.json()
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: buildChatPrompt(profile, ideaContext),
      messages,
    }),
  })
  const data = await res.json()
  return NextResponse.json(data)
}
```

### 3. 상태 관리 (Zustand)
```typescript
// /lib/store.ts
type AppStore = {
  profile: UserProfile
  setProfile: (p: UserProfile) => void
  messages: Message[]
  addMessage: (m: Message) => void
  ideaPhase: IdeaPhase
  ideaStep: number
  ideaData: IdeaData
  selectedProgram: string
  // ... 액션들
}
```

### 4. localStorage 연동
- 프로필 저장 시 localStorage에 자동 저장
- 앱 로드 시 localStorage에서 자동 복원
- 키: `policy-next-profile`

### 5. Vercel 배포
- GitHub 연동
- 환경변수 `ANTHROPIC_API_KEY` Vercel Dashboard에 등록
- 도메인 설정 (선택)

## 화면 구성 (3개) — 이미 구현됨

### 1. 홈 (/app/page.tsx)
- 헤더: SVG 로고 (방패 아이콘 + 그라데이션) + 프로필 아이콘 (저장 시 발광 점)
- 히어로: 라벨 뱃지 + 그라데이션 shimmer 제목 + 설명
- 검색 카드 (글래스): textarea + 그라데이션 버튼 + 예시 4개 (번호 라벨 포함)
- 마감임박 카드 5개: D-day 그라데이션 뱃지 + 지역 칩 + 금액
- 주요 기능 카드 4개 (2x2 그리드)
- 면책 문구

### 2. 채팅 (/app/chat/page.tsx)
3가지 상태 순차 전환:

**[일반 채팅]**
- 사용자 버블: 인디고→퍼플 그라데이션 (`rgba(99,102,241,0.3)` 그림자)
- AI 버블: 글래스 효과 (rgba(255,255,255,0.06) + blur)
- AI 아바타: SVG 방패 + 그라데이션
- 공고명 감지 시 입력창 위 "사업계획서 작성" 버튼 자동 노출

**[아이디어 수집 — ideaPhase: "collecting"]**
- 헤더에 `아이디어 수집 N/3` 보라 뱃지
- 상단 그라데이션 진행 바 (Indigo→Purple→Pink + glow)
- 질문 버블: 퍼플→핑크 그라데이션 배경, Q 아바타
- 입력창 위에 현재 질문 힌트 (Q1 뱃지 + 질문)

**[수집 완료 — ideaPhase: "done"]**
- 초록 액션 카드 (`linear-gradient(135deg, #10B981, #059669)`)
- ✨ 이모지 float 애니메이션
- 수집된 아이디어 요약 표시

**[사업계획서 패널]**
- 88vh 슬라이드업 시트 (`borderRadius: 24px 24px 0 0`)
- 핸들 바 (드래그 인디케이터)
- 헤더: 라벨(AI 사업계획서 초안) + 공고명 + 복사 버튼 + 닫기
- 로딩: conic-gradient ring spinner (인디고→퍼플→핑크 회전)
- 완성: 그라데이션 번호 뱃지 + 6섹션 + 면책

### 3. 프로필 (/app/profile/page.tsx)
- 프로필 아바타 (큰 그라데이션 박스 + 그림자)
- 폼 카드 (글래스): 지역/업종/업력 입력
- 그라데이션 저장 버튼
- 운영 원칙 4개 카드 (아이콘 박스 + 제목 + 설명)

## AI 프롬프트 (/lib/prompts.ts)

### buildChatPrompt
```typescript
export const buildChatPrompt = (profile: UserProfile, ideaContext?: string) => `
당신은 퍼펙트 정부지원정책 AI 컨설턴트입니다.
20년 경력 비즈니스 아키텍트 수준의 전문성으로 정부지원사업을 안내합니다.

${profile 입력 시 → [프로필] 블록 추가}
${ideaContext 있을 시 → [수집된 아이디어] 블록 추가}

원칙:
- 자연어 조건 자동 추출 → 맞춤 공고 추천
- 질문은 한 번에 1개만
- 추천 공고명은 **굵게** (그라데이션 강조 처리됨)
- 금액·마감 명확히
- 관심 표현 시 "사업계획서 작성을 도와드릴까요?" 자연스럽게 유도
- 친근하되 전문적 톤, 이모지 적절히
`
```

### buildPlanPrompt
```typescript
export const buildPlanPrompt = (
  profile: UserProfile,
  selectedProgram: string,
  ideaData: IdeaData
) => `
[신청 정보] 지원사업 / 지역 / 업종 / 업력
[사업 아이디어] 문제 / 고객 / 목표

→ 6섹션 사업계획서 초안:
1. 사업 개요
2. 문제 정의 및 시장 필요성
3. 솔루션 및 차별성
4. 목표 시장 및 고객
5. 추진 일정 (6개월 로드맵)
6. 기대 효과 및 활용 계획

마지막: "※ 본 초안은 AI 생성 참고용입니다."
`
```

## 환경변수 (.env.local)
```
ANTHROPIC_API_KEY=sk-ant-...
```

## 타입 정의 (/lib/types.ts)
```typescript
type UserProfile = { region: string; industry: string; age: string }
type IdeaData = { problem: string; target: string; goal: string }
type IdeaPhase = null | "collecting" | "done"
type MessageType = "user" | "assistant" | "question" | "system" | "ready"
type Message = {
  role: "user" | "assistant"
  content: string
  type?: MessageType
  ideaData?: IdeaData
}
```

## 상수 (/lib/constants.ts)

### 아이디어 수집 질문 3개
```typescript
export const IDEA_QUESTIONS = [
  { key: "problem", q: "어떤 문제를 해결하는 사업인가요?", hint: "핵심 한 문장으로", emoji: "💡" },
  { key: "target", q: "목표 고객과 예상 시장은요?", hint: "예: 30~40대 직장인 / 국내 SMB", emoji: "🎯" },
  { key: "goal", q: "6개월 안에 달성할 목표는?", hint: "예: 베타 출시 + MAU 1,000명", emoji: "🚀" },
]
```

### 예시 쿼리
1. 서울 IT 창업 2년차, 사업화 자금 필요해
2. 경기도 제조업 3년차 지원금 있을까?
3. 1인 기업 컨설팅 지원 알려줘
4. AI 도입 지원사업 추천해줘

### 마감임박 리스트 (더미 — 추후 기업마당 API 교체)
```typescript
export const DEADLINE_LIST = [
  { title: "2026년 여성발명왕EXPO 참가기업 모집", dday: 3, region: "전국", amount: "최대 500만원" },
  { title: "[서울] B the B 뷰티 융복합 콘텐츠 전시", dday: 5, region: "서울", amount: "참가비 지원" },
  { title: "[강원] 철원군 중소기업 수출단체보험 지원", dday: 7, region: "강원", amount: "보험료 80%" },
  { title: "[충남] 경영위기 소상공인 재기 지원사업", dday: 12, region: "충남", amount: "최대 2,000만원" },
  { title: "AI·디지털전환 지원사업", dday: 18, region: "전국", amount: "최대 5,000만원" },
]
```

## 디자인 시스템 (변경 금지)

### 컬러 토큰
```typescript
// 배경
'#0F0F1E'                                                    // 메인 배경 (다크 네이비)
'#1A1B2E'                                                    // 패널 배경

// 그라데이션 (포인트)
'linear-gradient(135deg, #6366F1 0%, #A855F7 100%)'         // Indigo → Purple (메인)
'linear-gradient(120deg, #6366F1 0%, #A855F7 50%, #EC4899)' // Indigo → Purple → Pink (히어로)
'linear-gradient(135deg, #A855F7, #EC4899)'                 // 질문 버블
'linear-gradient(135deg, #10B981 0%, #059669 100%)'         // 완료 액션 (초록)
'linear-gradient(135deg, #FF4D6D, #FF8C42)'                 // D-day 임박

// 글래스 효과
background: 'rgba(255,255,255,0.04~0.06)'
border: '1px solid rgba(255,255,255,0.06~0.08)'
backdropFilter: 'blur(20px)'

// 텍스트
'#F1F5F9'   // 주
'#CBD5E1'   // 본문
'#94A3B8'   // 서브
'#64748B'   // 메타

// 포인트 텍스트
'#A5B4FC'   // 라벨 (인디고 라이트)
'#D8B4FE'   // 진행 표시 (퍼플 라이트)
'#10B981'   // 금액 (그린)
```

### 그림자 (컬러 그림자)
```css
/* 인디고 글로우 */
box-shadow: 0 4px 16px rgba(99,102,241,0.3);
box-shadow: 0 8px 24px rgba(99,102,241,0.4);

/* 임박 글로우 */
box-shadow: 0 4px 12px rgba(255,77,109,0.3);

/* 완료 글로우 */
box-shadow: 0 8px 24px rgba(16,185,129,0.35);
```

### 애니메이션 (글로벌 CSS)
```css
@keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
@keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:0.4} 30%{transform:translateY(-6px);opacity:1} }
@keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
@keyframes spin { to{transform:rotate(360deg)} }
@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.1)} }
@keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
```

### 배경 효과 (고정 레이어)
```typescript
// 1. 라디얼 그라데이션 오브
background: `
  radial-gradient(ellipse 80% 50% at 50% 0%, rgba(99,102,241,0.25) 0%, transparent 60%),
  radial-gradient(ellipse 60% 40% at 100% 30%, rgba(168,85,247,0.15) 0%, transparent 60%),
  radial-gradient(ellipse 60% 40% at 0% 60%, rgba(99,102,241,0.1) 0%, transparent 60%)
`

// 2. SVG 노이즈 텍스처 오버레이 (opacity 0.4)
```

### 사이즈
- 모바일 최대폭: 480px (중앙 정렬)
- 폰트: Pretendard, Apple SD Gothic Neo, Noto Sans KR, SF Pro Display
- 둥근 모서리: 카드 16~20px / 버튼 12px / 시트 24px
- 사업계획서 패널: 88vh

## 실패 규칙 (반드시 지킬 것)
- ❌ ANTHROPIC_API_KEY 클라이언트 노출 → 즉시 중단 (반드시 서버 라우트 경유)
- ❌ AI가 공고를 직접 생성(hallucination) → 시스템 프롬프트로 차단
- ❌ 면책 문구 누락 → 빌드 실패 처리
- ❌ 더미 데이터를 실제 데이터로 표기 → 금지
- ❌ ideaPhase === "done" 전 /api/plan 호출 → 금지
- ❌ 디자인 변경 (Tailwind 변환, 컬러 변경 등) → 금지 (인라인 스타일 객체 유지)

## 1단계 구현 범위 (MVP) — Claude Code 작업
- [ ] Next.js 14 프로젝트 초기화 (App Router, TypeScript)
- [ ] policy-next-v4.jsx → 페이지/컴포넌트 분리
- [ ] /api/chat/route.ts (서버 사이드 Claude 호출)
- [ ] /api/plan/route.ts (서버 사이드 Claude 호출)
- [ ] Zustand 스토어 도입
- [ ] localStorage 프로필 저장/복원
- [ ] 글로벌 CSS 분리 (@keyframes)
- [ ] 환경변수 설정
- [ ] Vercel 배포 + GitHub 연동

## 2단계 (MVP 이후)
- 기업마당 공공 API 연동 (data.go.kr)
- 회원가입 / 로그인 (Supabase)
- 관심 공고 저장 + 마감 알림
- 사업계획서 PDF 출력 (유료)
- 심사 점수 예측 기능
- 채팅 세션 저장 (대화 이어서 하기)

## Claude Code 첫 명령 예시
```
CLAUDE.md를 읽고 policy-next-v4.jsx를 Next.js 14 App Router 프로젝트로
분리해줘. 디자인(스타일 객체 S, 그라데이션, 애니메이션)은 그대로 유지하고,
다음 작업에 집중해줘:

1. 페이지/컴포넌트 분리
2. /api/chat, /api/plan 서버 라우트로 분리 (API 키 보안)
3. Zustand 도입
4. localStorage 프로필 자동 저장
5. .env.local 설정

Tailwind 변환은 절대 하지 말 것. 인라인 스타일 그대로 유지.
```
