import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// 정렬할 수 있는 숫자 열 — 표의 열 제목을 누르면 엑셀처럼 정렬됩니다.
const SORT_KEYS = ['count', 'dist', 'kg'] as const
type SortKey = (typeof SORT_KEYS)[number]
type SortDir = 'desc' | 'asc'

const SORT_LABEL: Record<SortKey, string> = {
  count: '인증 횟수',
  dist: '이동 거리',
  kg: '감축량',
}

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: { harvested?: string; sort?: string; dir?: string }
}) {
  const supabase = createClient()
  const onlyHarvested = searchParams.harvested === '1'

  // 정렬 상태 — sort 값이 없거나 이상하면 '기본(가입순)'으로 둡니다.
  const sortKey = SORT_KEYS.includes(searchParams.sort as SortKey)
    ? (searchParams.sort as SortKey)
    : null
  const sortDir: SortDir = searchParams.dir === 'asc' ? 'asc' : 'desc'

  const { data: settings } = await supabase.from('settings').select('target_co2_kg').eq('id', 1).single()
  const targetKg = Number(settings?.target_co2_kg ?? 5)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, username, phone')
    .order('created_at', { ascending: true })

  const { data: certs } = await supabase
    .from('certifications')
    .select('user_id, distance_km, co2_reduced_g, status')
    .eq('status', 'approved')

  // 1인당 집계
  const agg = new Map<string, { count: number; dist: number; g: number }>()
  for (const c of certs ?? []) {
    const a = agg.get(c.user_id) ?? { count: 0, dist: 0, g: 0 }
    a.count++
    a.dist += Number(c.distance_km)
    a.g += Number(c.co2_reduced_g)
    agg.set(c.user_id, a)
  }

  let list = (profiles ?? []).map((p) => {
    const a = agg.get(p.id) ?? { count: 0, dist: 0, g: 0 }
    const kg = a.g / 1000
    return { ...p, count: a.count, dist: a.dist, kg, harvested: kg >= targetKg }
  })
  if (onlyHarvested) list = list.filter((p) => p.harvested)

  // 정렬 — 값이 같은 사람끼리는 원래 순서(가입순)가 그대로 유지됩니다(JS sort는 안정 정렬).
  if (sortKey) {
    list = [...list].sort((a, b) =>
      sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
    )
  }

  /** 열 제목을 눌렀을 때 갈 주소.
   *  처음 누르면 내림차순(많은 순), 같은 열을 다시 누르면 오름차순으로 뒤집힙니다. */
  function sortHref(key: SortKey): string {
    return buildHref(onlyHarvested, key, sortKey === key && sortDir === 'desc' ? 'asc' : 'desc')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-800">참가자 명부 ({list.length}명)</h1>
        <a
          href="/admin/export"
          className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          ⬇️ CSV(엑셀) 다운로드
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {/* 필터 — 정렬 상태는 그대로 유지한 채 바뀝니다 */}
        <Link
          href={buildHref(false, sortKey, sortDir)}
          className={`rounded-lg px-3 py-1.5 ${!onlyHarvested ? 'bg-green-100 font-medium text-green-700' : 'bg-white text-gray-500'}`}
        >
          전체
        </Link>
        <Link
          href={buildHref(true, sortKey, sortDir)}
          className={`rounded-lg px-3 py-1.5 ${onlyHarvested ? 'bg-green-100 font-medium text-green-700' : 'bg-white text-gray-500'}`}
        >
          수확 달성자만
        </Link>

        {/* 정렬 중일 때만 표시 — 무엇으로 정렬됐는지 알려주고 되돌릴 수 있게 */}
        {sortKey && (
          <span className="ml-1 inline-flex items-center gap-2 rounded-lg bg-green-50 px-3 py-1.5 text-xs text-green-800">
            정렬: {SORT_LABEL[sortKey]} {sortDir === 'desc' ? '많은순 ▼' : '적은순 ▲'}
            <Link href={buildHref(onlyHarvested, null, sortDir)} className="font-bold underline hover:no-underline">
              해제
            </Link>
          </span>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-gray-400">
              <th className="px-3 py-2">이름</th>
              <th className="px-3 py-2">아이디</th>
              <th className="px-3 py-2">연락처</th>
              <SortableTh label="인증" href={sortHref('count')} active={sortKey === 'count'} dir={sortDir} />
              <SortableTh label="거리" href={sortHref('dist')} active={sortKey === 'dist'} dir={sortDir} />
              <SortableTh label="감축" href={sortHref('kg')} active={sortKey === 'kg'} dir={sortDir} />
              <th className="px-3 py-2 text-center">수확</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium text-gray-800">{p.name}</td>
                <td className="px-3 py-2 text-gray-500">{p.username}</td>
                <td className="px-3 py-2 text-gray-500">{p.phone}</td>
                <td className={cellCls(sortKey === 'count')}>{p.count}회</td>
                <td className={cellCls(sortKey === 'dist')}>{p.dist.toFixed(1)}km</td>
                <td className={cellCls(sortKey === 'kg')}>{p.kg.toFixed(2)}kg</td>
                <td className="px-3 py-2 text-center">{p.harvested ? '🍅' : '–'}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-400">
                  해당하는 참가자가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/** 필터·정렬 상태를 합쳐 주소를 만듭니다. (한쪽을 바꿔도 다른 쪽은 유지) */
function buildHref(harvested: boolean, sortKey: SortKey | null, sortDir: SortDir): string {
  const params = new URLSearchParams()
  if (harvested) params.set('harvested', '1')
  if (sortKey) {
    params.set('sort', sortKey)
    params.set('dir', sortDir)
  }
  const qs = params.toString()
  return qs ? `/admin/participants?${qs}` : '/admin/participants'
}

/** 정렬 중인 열은 숫자도 초록 굵게 표시해 한눈에 보이게 */
function cellCls(active: boolean): string {
  return `px-3 py-2 text-right ${active ? 'font-semibold text-green-700' : ''}`
}

/** 눌러서 정렬되는 열 제목 (엑셀 정렬 화살표와 같은 느낌) */
function SortableTh({
  label,
  href,
  active,
  dir,
}: {
  label: string
  href: string
  active: boolean
  dir: SortDir
}) {
  return (
    <th className="px-3 py-2 text-right">
      <Link
        href={href}
        title={`${label} 기준으로 정렬`}
        className={`inline-flex items-center gap-1 rounded px-1 py-0.5 hover:bg-gray-100 ${
          active ? 'font-bold text-green-700' : 'text-gray-400'
        }`}
      >
        {label}
        <span className={active ? '' : 'text-gray-300'}>
          {active ? (dir === 'desc' ? '▼' : '▲') : '↕'}
        </span>
      </Link>
    </th>
  )
}
