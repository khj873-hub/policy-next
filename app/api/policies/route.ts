import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const keyword = searchParams.get('keyword') || ''
  const pageUnit = parseInt(searchParams.get('pageUnit') || '20', 10)

  try {
    const filePath = join(process.cwd(), 'public', 'policies-cache.json')
    const raw = await readFile(filePath, 'utf-8')
    const cache = JSON.parse(raw) as {
      updatedAt: string
      total: number | string
      items: {
        id: string; title: string; dday: number; region: string
        amount: string; target: string; deadline: string; url: string
      }[]
    }

    let items = cache.items
    if (keyword) {
      const kw = keyword.toLowerCase()
      items = items.filter(
        (i) => i.title.includes(kw) || i.region.includes(kw) || i.target.includes(kw)
      )
    }

    return NextResponse.json({
      items: items.slice(0, pageUnit),
      total: cache.total,
      updatedAt: cache.updatedAt,
    })
  } catch (e) {
    return NextResponse.json({ error: '캐시 파일 없음', detail: String(e) }, { status: 500 })
  }
}
