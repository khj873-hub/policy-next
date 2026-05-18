# 퍼펙트 정부지원정책 AI

한국 중소기업·스타트업을 위한 AI 기반 정부지원 공고 추천 및 사업계획서 자동 생성 서비스.

## 주요 기능

- **AI 공고 추천**: Claude Haiku 기반 채팅으로 기업마당 실데이터에서 맞춤 공고 추천
- **사업계획서 자동 생성**: 3단계 아이디어 수집 후 Claude Sonnet으로 6섹션 초안 생성
- **최신 공고 목록**: 기업마당 API 연동, D-day 순/최신순 정렬
- **Google 간편 로그인**: NextAuth.js + Supabase 사용자 관리
- **관리자 대시보드**: 가입이력·채팅이력·사업계획서 통계 (/admin)

## 기술 스택

| 영역 | 기술 |
|---|---|
| 프레임워크 | Next.js 14 App Router, TypeScript |
| 상태관리 | Zustand |
| AI | Anthropic Claude (Haiku 4.5 채팅 / Sonnet 4.6 사업계획서) |
| 인증 | NextAuth.js v4, Google OAuth |
| DB | Supabase (PostgreSQL, Tokyo 리전) |
| 데이터 | 기업마당 API → GitHub Actions 일일 캐시 갱신 |
| 배포 | Vercel (hnd1 Tokyo) |

## 로컬 실행

```bash
npm install
# .env.local 설정 (아래 환경변수 섹션 참조)
npm run dev        # http://localhost:3001
```

## 환경변수 (.env.local)

```
ANTHROPIC_API_KEY=           # Anthropic API 키
BIZINFO_API_KEY=             # 기업마당 API 키 (MF5MYV)
GOOGLE_CLIENT_ID=            # Google OAuth 클라이언트 ID
GOOGLE_CLIENT_SECRET=        # Google OAuth 시크릿
NEXTAUTH_SECRET=             # NextAuth 시크릿 (랜덤 문자열)
NEXTAUTH_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=    # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=   # Supabase service role key
ADMIN_EMAIL=                 # 관리자 Google 계정 이메일
```

## Supabase 스키마

```sql
-- users, chats, plans 테이블
-- supabase/migrations/ 참조
```

## 공고 데이터 갱신

기업마당 API는 한국 IP만 허용. 로컬에서 수동 갱신:

```bash
node scripts/fetch-policies.mjs
```

GitHub Actions (`.github/workflows/refresh-policies.yml`)로 매일 KST 10:00 자동 갱신.

## 배포

- **Production**: https://policy-next.vercel.app
- Vercel에서 이 repo 연결 후 환경변수 설정
- `main` 브랜치 push 시 자동 배포
