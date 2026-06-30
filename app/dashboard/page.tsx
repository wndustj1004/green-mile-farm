import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGrowth } from '@/lib/growth'
import StageSlider from './StageSlider'
import { logoutAction } from './actions'

export const dynamic = 'force-dynamic' // 항상 최신 데이터로 렌더

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1) 내 프로필
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, is_admin')
    .eq('id', user.id)
    .single()

  // 2) 전역 설정(목표 감축량)
  const { data: settings } = await supabase
    .from('settings')
    .select('target_co2_kg')
    .eq('id', 1)
    .single()
  const targetKg = Number(settings?.target_co2_kg ?? 5)

  // 3) 내 인증 내역(승인된 것만) → 통계 집계
  const { data: certs } = await supabase
    .from('certifications')
    .select('distance_km, co2_reduced_g')
    .eq('user_id', user.id)
    .eq('status', 'approved')

  const count = certs?.length ?? 0
  const totalDistance = (certs ?? []).reduce((s, c) => s + Number(c.distance_km), 0)
  const totalReducedG = (certs ?? []).reduce((s, c) => s + Number(c.co2_reduced_g), 0)
  const totalKg = totalReducedG / 1000

  const growth = getGrowth(totalKg, targetKg)

  return (
    <main className="min-h-screen bg-green-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        {/* 상단: 인사 + 로그아웃 */}
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-600">
            🌱 {profile?.name ?? '회원'}님의 텃밭
          </p>
          <div className="flex items-center gap-3">
            {profile?.is_admin && (
              <Link href="/admin" className="text-xs font-medium text-green-700 hover:underline">
                관리자
              </Link>
            )}
            <form action={logoutAction}>
              <button className="text-xs text-gray-400 hover:text-gray-600">로그아웃</button>
            </form>
          </div>
        </div>

        {/* 작물 + 성장 상태바 */}
        <div className="rounded-2xl bg-white p-7 text-center shadow-sm">
          <div className="text-7xl leading-none">{growth.emoji}</div>
          <p className="mt-3 text-sm font-medium text-green-700">
            {growth.stage}단계 · {growth.stageName}
          </p>

          {/* 성장 상태바 */}
          <div className="mt-4">
            <div className="relative h-7 w-full overflow-hidden rounded-full bg-green-100">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${growth.percent}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
                {totalKg.toFixed(2)} / {targetKg.toFixed(1)} kg CO₂
              </div>
            </div>
            <p className="mt-1 text-right text-xs text-gray-400">
              {growth.percent.toFixed(0)}% 달성
            </p>
          </div>

          {/* 5단계 도달 시 수확 안내 */}
          {growth.harvested && (
            <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              🎉 목표를 달성했어요! 방울토마토를 수확할 수 있습니다.
              <br />
              운영진이 상품 수령 안내를 드릴 예정이에요.
            </div>
          )}
        </div>

        {/* 누적 통계 3종 */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <StatCard label="누적 인증" value={`${count}회`} />
          <StatCard label="누적 이동" value={`${totalDistance.toFixed(1)}km`} />
          <StatCard label="누적 감축" value={`${totalKg.toFixed(2)}kg`} />
        </div>

        {/* 작물 성장 단계 슬라이더 */}
        <StageSlider targetKg={targetKg} totalKg={totalKg} />

        {/* 작물 키우기 버튼 */}
        <Link
          href="/certify"
          className="mt-5 block rounded-xl bg-green-600 py-4 text-center text-lg font-semibold text-white shadow-sm hover:bg-green-700"
        >
          🚶 작물 키우기 (이동 인증하기)
        </Link>

        {/* 인증 내용 보기 */}
        <Link
          href="/my"
          className="mt-3 block rounded-xl border border-green-600 py-3 text-center font-semibold text-green-700 hover:bg-green-100"
        >
          📋 인증 내용 보기
        </Link>
      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-3 text-center shadow-sm">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-base font-bold text-green-700">{value}</p>
    </div>
  )
}
