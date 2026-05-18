import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { buildChatPrompt } from '@/lib/prompts'
import { supabaseAdmin } from '@/lib/supabase'
import type { UserProfile, PolicyItem } from '@/lib/types'

async function loadPolicies(): Promise<PolicyItem[]> {
  try {
    const raw = await readFile(join(process.cwd(), 'public', 'policies-cache.json'), 'utf-8')
    return JSON.parse(raw).items || []
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  const { messages, profile, ideaContext, userEmail } = await req.json() as {
    messages: { role: string; content: string }[]
    profile: UserProfile
    ideaContext?: string | null
    userEmail?: string | null
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
      system: [{ type: 'text', text: buildChatPrompt(profile, ideaContext, policies), cache_control: { type: 'ephemeral' } }],
      messages,
    }),
  })

  const data = await res.json()
  const answer = data.content?.map((c: { text?: string }) => c.text || '').join('') || ''
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')

  if (userEmail && lastUserMsg && answer) {
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', userEmail).single()
    await supabaseAdmin.from('chats').insert({
      user_id: user?.id || null,
      user_email: userEmail,
      question: lastUserMsg.content,
      answer,
    })
  }

  return NextResponse.json({ content: data.content })
}
