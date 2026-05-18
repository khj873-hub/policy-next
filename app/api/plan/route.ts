import { NextRequest, NextResponse } from 'next/server'
import { buildPlanPrompt } from '@/lib/prompts'
import { supabaseAdmin } from '@/lib/supabase'
import type { UserProfile, IdeaData } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { profile, selectedProgram, ideaData, userEmail } = await req.json() as {
    profile: UserProfile
    selectedProgram: string
    ideaData: IdeaData
    userEmail?: string | null
  }

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [{ type: 'text', text: buildPlanPrompt(profile, selectedProgram, ideaData), cache_control: { type: 'ephemeral' } }],
      }],
    }),
  })

  const data = await res.json()
  const content = data.content?.map((c: { text?: string }) => c.text || '').join('') || ''

  if (userEmail && content) {
    const { data: user } = await supabaseAdmin.from('users').select('id').eq('email', userEmail).single()
    await supabaseAdmin.from('plans').insert({
      user_id: user?.id || null,
      user_email: userEmail,
      program: selectedProgram,
      problem: ideaData.problem,
      target_customer: ideaData.target,
      goal: ideaData.goal,
      content,
    })
  }

  return NextResponse.json({ content: data.content })
}
