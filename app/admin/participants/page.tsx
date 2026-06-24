import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: { harvested?: string }
}) {
  const supabase = createClient()
  const onlyHarvested = searchParams.harvested === '1'

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

      <div className="flex gap-2 text-sm">
        <Link href="/admin/participants" className={`rounded-lg px-3 py-1.5 ${!onlyHarvested ? 'bg-green-100 font-medium text-green-700' : 'bg-white text-gray-500'}`}>
          전체
        </Link>
        <Link href="/admin/participants?harvested=1" className={`rounded-lg px-3 py-1.5 ${onlyHarvested ? 'bg-green-100 font-medium text-green-700' : 'bg-white text-gray-500'}`}>
          수확 달성자만
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-gray-400">
              <th className="px-3 py-2">이름</th>
              <th className="px-3 py-2">아이디</th>
              <th className="px-3 py-2">연락처</th>
              <th className="px-3 py-2 text-right">인증</th>
              <th className="px-3 py-2 text-right">거리</th>
              <th className="px-3 py-2 text-right">감축</th>
              <th className="px-3 py-2 text-center">수확</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="px-3 py-2 font-medium text-gray-800">{p.name}</td>
                <td className="px-3 py-2 text-gray-500">{p.username}</td>
                <td className="px-3 py-2 text-gray-500">{p.phone}</td>
                <td className="px-3 py-2 text-right">{p.count}회</td>
                <td className="px-3 py-2 text-right">{p.dist.toFixed(1)}km</td>
                <td className="px-3 py-2 text-right">{p.kg.toFixed(2)}kg</td>
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
