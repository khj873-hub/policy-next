import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { buildChatPrompt } from '@/lib/prompts'
import type { UserProfile, PolicyItem } from '@/lib/types'

async function loadPolicies(): Promise<PolicyItem[]> {
  try {
    const raw = await readFile(join(process.cwd(), 'public', 'policies-cache.json'), 'utf-8')
    const cache = JSON.parse(raw)
    return cache.items || []
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  const { messages, profile, ideaContext } = await req.json() as {
    messages: { role: string; content: string }[]
    profile: UserProfile
    ideaContext?: string | null
  }

  const policies = await loadPolicies()

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: [
        {
          type: 'text',
          text: buildChatPrompt(profile, ideaContext, policies),
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages,
    }),
  })

  const data = await res.json()
  return NextResponse.json(data)
}
