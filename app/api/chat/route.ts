import { NextRequest, NextResponse } from 'next/server'
import { buildChatPrompt } from '@/lib/prompts'
import type { UserProfile } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { messages, profile, ideaContext } = await req.json() as {
    messages: { role: string; content: string }[]
    profile: UserProfile
    ideaContext?: string | null
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
      system: buildChatPrompt(profile, ideaContext),
      messages,
    }),
  })

  const data = await res.json()
  return NextResponse.json(data)
}
