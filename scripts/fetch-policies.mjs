// 기업마당 데이터 로컬 갱신 스크립트
// 사용법: node scripts/fetch-policies.mjs
// 한국 IP 환경에서 실행해야 합니다 (기업마당 해외 IP 차단)

import { writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const API_KEY = process.env.BIZINFO_API_KEY || 'MF5MYV'
const BASE_URL = 'https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do'
const PAGE_SIZE = 100

const REGION_MAP = {
  '경상북도': '경북', '경상남도': '경남', '전라북도': '전북', '전라남도': '전남',
  '충청북도': '충북', '충청남도': '충남', '경기도': '경기', '강원특별자치도': '강원',
  '강원도': '강원', '제주특별자치도': '제주', '서울특별시': '서울', '부산광역시': '부산',
  '대구광역시': '대구', '인천광역시': '인천', '광주광역시': '광주', '대전광역시': '대전',
  '울산광역시': '울산', '세종특별자치시': '세종', '중소벤처기업부': '전국',
}

function parseDday(s) {
  const m = (s || '').match(/~ (\d{4}-\d{2}-\d{2})/)
  if (!m) return 999
  const end = new Date(m[1])
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.ceil((end - today) / 86400000)
}

function extractAmount(html) {
  const text = (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  const m1 = text.match(/최대\s*([\d,]+\s*(?:만원|억원|천만원))/)
  if (m1) return `최대 ${m1[1]}`
  const m2 = text.match(/([\d,]+\s*(?:만원|억원|천만원))\s*(?:지원|이내)/)
  if (m2) return m2[1]
  return '지원금 있음'
}

function toRegion(name) {
  if (REGION_MAP[name]) return REGION_MAP[name]
  return name?.length > 2 ? name.slice(0, 2) : (name || '전국')
}

async function fetchPage(pageIndex) {
  const url = new URL(BASE_URL)
  url.searchParams.set('crtfcKey', API_KEY)
  url.searchParams.set('dataType', 'json')
  url.searchParams.set('pageUnit', String(PAGE_SIZE))
  url.searchParams.set('pageIndex', String(pageIndex))
  const res = await fetch(url.toString())
  return res.json()
}

async function main() {
  console.log('기업마당 데이터 갱신 시작...')
  const first = await fetchPage(1)
  const rawItems = first.jsonArray || []
  const total = parseInt(rawItems[0]?.totCnt || '0', 10)

  const allRaw = [...rawItems]
  const pages = Math.min(Math.ceil(total / PAGE_SIZE), 5) // 최대 5페이지 (500건)
  for (let p = 2; p <= pages; p++) {
    const d = await fetchPage(p)
    allRaw.push(...(d.jsonArray || []))
    process.stdout.write(`.`)
  }
  console.log(`\n총 ${allRaw.length}건 수신`)

  const items = allRaw
    .map((item) => ({
      id: item.pblancId,
      title: item.pblancNm,
      dday: parseDday(item.reqstBeginEndDe),
      region: toRegion(item.jrsdInsttNm),
      amount: extractAmount(item.bsnsSumryCn),
      target: item.trgetNm || '',
      deadline: item.reqstBeginEndDe || '',
      url: item.pblancUrl || '',
    }))
    .filter((i) => i.dday >= 0)
    .sort((a, b) => a.dday - b.dday)

  const cache = {
    updatedAt: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    total,
    items,
  }

  const outPath = join(__dirname, '..', 'public', 'policies-cache.json')
  await writeFile(outPath, JSON.stringify(cache, null, 2), 'utf-8')
  console.log(`저장 완료: ${items.length}건 → public/policies-cache.json`)
}

main().catch(console.error)
