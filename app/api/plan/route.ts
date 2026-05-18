import { NextRequest, NextResponse } from 'next/server'
import { buildPlanPrompt } from '@/lib/prompts'
import type { UserProfile, IdeaData } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { profile, selectedProgram, ideaData } = await req.json() as {
    profile: UserProfile
    selectedProgram: string
    ideaData: IdeaData
  }

  // 사업계획서는 6섹션 정밀 작성 → Sonnet 유지, max_tokens 2000으로 확대
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',  // 사업계획서는 Sonnet 유지 (정밀도 필요)
      max_tokens: 2000,             // 6섹션 충분히 작성되도록 확대
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: buildPlanPrompt(profile, selectedProgram, ideaData),
              cache_control: { type: 'ephemeral' },
            },
          ],
        },
      ],
    }),
  })

  const data = await res.json()
  return NextResponse.json(data)
}
