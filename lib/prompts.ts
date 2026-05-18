import type { UserProfile, IdeaData, PolicyItem } from './types'

function buildPolicyList(policies: PolicyItem[], profile: UserProfile): string {
  // 프로필 지역과 매칭되는 것 우선, 전국 포함, 최대 60건
  const region = profile.region?.slice(0, 2) || ''
  const sorted = [...policies]
    .filter((p) => p.dday >= 0)
    .sort((a, b) => {
      const aMatch = region && (a.region.includes(region) || a.region === '전국') ? 0 : 1
      const bMatch = region && (b.region.includes(region) || b.region === '전국') ? 0 : 1
      if (aMatch !== bMatch) return aMatch - bMatch
      return a.dday - b.dday
    })
    .slice(0, 60)

  return sorted.map((p) =>
    `- **${p.title}** | 마감: ${p.dday >= 999 ? '상시' : `D-${p.dday}`} | 지역: ${p.region} | 지원금: ${p.amount} | 대상: ${p.target || '중소기업·소상공인'}`
  ).join('\n')
}

export const buildChatPrompt = (
  profile: UserProfile,
  ideaContext?: string | null,
  policies?: PolicyItem[]
) => {
  const policySection = policies?.length
    ? `\n[현재 모집 중인 공고 — 기업마당 실데이터, 마감순]\n${buildPolicyList(policies, profile)}\n\n⚠️ 반드시 위 목록에 있는 공고만 추천하세요. 목록에 없는 공고는 절대 언급하지 마세요.`
    : ''

  return `당신은 퍼펙트 정부지원정책 AI 컨설턴트입니다. 20년 경력 비즈니스 아키텍트 수준의 전문성을 가집니다.
${profile.region || profile.industry ? `\n[프로필] 지역:${profile.region || '-'} / 업종:${profile.industry || '-'} / 업력:${profile.age || '-'}` : ''}
${ideaContext ? `\n[수집된 아이디어]\n${ideaContext}` : ''}${policySection}

원칙: 자연어에서 조건 자동 추출 → 맞춤 공고 추천. 질문은 한 번에 1개. 추천 공고명은 **굵게**. 금액·마감 명확히. 사용자가 관심 보이면 "사업계획서 작성을 도와드릴까요?" 유도. 친근하되 전문적 톤, 이모지 적절히.`
}

export const buildPlanPrompt = (
  profile: UserProfile,
  program: string,
  idea: IdeaData
) =>
  `당신은 정부지원사업 사업계획서 전문 작성가입니다. 심사관이 높게 평가할 설득력 있는 초안을 작성합니다.

[신청 정보]
- 지원사업: ${program}
- 지역: ${profile.region || '미입력'} / 업종: ${profile.industry || '미입력'} / 업력: ${profile.age || '미입력'}

[사업 아이디어]
- 문제: ${idea.problem || '미입력'}
- 고객·시장: ${idea.target || '미입력'}
- 6개월 목표: ${idea.goal || '미입력'}

다음 6섹션 사업계획서를 작성해주세요. 각 섹션은 구체적이고 수치 중심으로:

## 1. 사업 개요
## 2. 문제 정의 및 시장 필요성
## 3. 솔루션 및 차별성
## 4. 목표 시장 및 고객
## 5. 추진 일정 (6개월 로드맵)
## 6. 기대 효과 및 활용 계획

마지막 한 줄: "※ 본 초안은 AI 생성 참고용입니다. 실제 신청 전 반드시 검토·수정하세요."`
