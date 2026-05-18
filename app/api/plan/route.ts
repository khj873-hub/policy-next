import { NextRequest, NextResponse } from 'next/server'
import { buildPlanPrompt } from '@/lib/prompts'
import type { UserProfile, IdeaData } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { profile, selectedProgram, ideaData } = await req.json() as {
    profile: UserProfile
    selectedProgram: string
    ideaData: IdeaData
  }

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
      messages: [{ role: 'user', content: buildPlanPrompt(profile, selectedProgram, ideaData) }],
    }),
  })

  const data = await res.json()
  return NextResponse.json(data)
}
