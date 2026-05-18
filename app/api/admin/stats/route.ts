import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const session = await getServerSession()
  if (session?.user?.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const tab = searchParams.get('tab') || 'dashboard'

  if (tab === 'dashboard') {
    const [{ count: totalUsers }, { count: totalChats }, { count: totalPlans },
           { count: todayUsers }, { count: todayChats }] = await Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('chats').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('plans').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().slice(0, 10)),
      supabaseAdmin.from('chats').select('*', { count: 'exact', head: true })
        .gte('created_at', new Date().toISOString().slice(0, 10)),
    ])
    return NextResponse.json({ totalUsers, totalChats, totalPlans, todayUsers, todayChats })
  }

  if (tab === 'users') {
    const { data } = await supabaseAdmin.from('users')
      .select('id, email, name, avatar, region, industry, age, created_at, last_seen_at')
      .order('created_at', { ascending: false })
      .limit(100)
    return NextResponse.json({ data })
  }

  if (tab === 'chats') {
    const { data } = await supabaseAdmin.from('chats')
      .select('id, user_email, question, answer, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
    return NextResponse.json({ data })
  }

  if (tab === 'plans') {
    const { data } = await supabaseAdmin.from('plans')
      .select('id, user_email, program, problem, target_customer, goal, created_at')
      .order('created_at', { ascending: false })
      .limit(100)
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'invalid tab' }, { status: 400 })
}
