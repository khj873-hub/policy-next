import { NextRequest, NextResponse } from 'next/server'
import { buildChatPrompt } from '@/lib/prompts'
import type { UserProfile } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { messages, profile, ideaContext } = await req.json() as {
    messages: { role: string; content: string }[]
    profile: UserProfile
    ideaContext?: string | null
  }

  // 시스템 프롬프트 캐싱: 동일 프롬프트 반복 호출 시 입력 비용 90% 절감
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001', // 채팅은 Haiku — Sonnet 대비 비용 75% 절감
      max_tokens: 500,                     // 채팅 응답은 500으로 충분
      system: [
        {
          type: 'text',
          text: buildChatPrompt(profile, ideaContext),
          cache_control: { type: 'ephemeral' }, // 5분간 캐시 유지
        },
      ],
      messages,
    }),
  })

  const data = await res.json()
  return NextResponse.json(data)
}
