import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getGrowth, STAGE_START_RATIO } from '@/lib/growth'
import { TRANSPORTS, TRANSPORT_LABEL, type TransportKey } from '@/lib/transport'
import StageSlider from './StageSlider'
import WeeklyRanking, { type RankItem } from '@/components/WeeklyRanking'
import AppGuide from '@/components/AppGuide'
import AndroidAppGuide from '@/components/AndroidAppGuide'
import Reveal from '@/components/Reveal'
import NameEditor from './NameEditor'
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

  // 2) 전역 설정(목표 감축량 + 챌린지 종료일)
  const { data: settings } = await supabase
    .from('settings')
    .select('target_co2_kg, challenge_end')
    .eq('id', 1)
    .single()
  const targetKg = Number(settings?.target_co2_kg ?? 5)

  // 챌린지 마감까지 D-day
  let dday: number | null = null
  if (settings?.challenge_end) {
    const end = new Date(settings.challenge_end as string)
    const today = new Date()
    end.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    const diff = Math.round((end.getTime() - today.getTime()) / 86400000)
    if (diff >= 0) dday = diff
  }

  // 3) 내 인증 내역(승인된 것만) → 통계 집계
  const { data: certs } = await supabase
    .from('certifications')
    .select('distance_km, co2_reduced_g')
    .eq('user_id', user.id)
    .eq('status', 'approved')

  const count = certs?.length ?? 0
  const totalDistance = (certs ?? []).reduce((s, c) => s + Number(c.distance_km), 0)
  const totalReducedG = (certs ?? []).reduce((s, c) => s + Number(c.co2_reduced_g), 0)
  // 주간 랭킹 보너스(상위 3명 +50%, 완료된 주만) 포함 실효 감축량
  const { data: effRaw } = await supabase.rpc('effective_reduction_g', { uid: user.id })
  const totalKg = effRaw != null ? Number(effRaw) / 1000 : totalReducedG / 1000

  const growth = getGrowth(totalKg, targetKg)

  // 다음 단계까지 남은 감축량
  let toNext: number | null = null
  if (growth.stage < 5) {
    const nextKg = STAGE_START_RATIO[growth.stage] * targetKg
    toNext = Math.max(nextKg - totalKg, 0)
  }

  // 4) 최근 인증 (모든 상태)
  const { data: recent } = await supabase
    .from('certifications')
    .select('id, transport, distance_km, co2_reduced_g, status, processed_at, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)
  const recentRows = recent ?? []

  // 5) 이번 주 랭킹 (상위 6명, 수확 도달자 제외, 상위 3명 +50%)
  const { data: rankRaw } = await supabase.rpc('weekly_ranking')
  const ranking = (rankRaw ?? []) as RankItem[]
  const kstNow = new Date(Date.now() + 9 * 3600 * 1000)
  const weekLabel = `${kstNow.getUTCMonth() + 1}월 ${Math.ceil(kstNow.getUTCDate() / 7)}주차`

  return (
    <main className="min-h-screen bg-gm-cream2 px-5 py-7">
      <div className="mx-auto max-w-md">
        {/* 상단: 인사 + 관리자/로그아웃 */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] text-gm-muted2">안녕하세요 👋</p>
            <p className="mt-1 text-xl font-bold tracking-tight text-gm-ink2">
              {profile?.name ?? '회원'}님의 텃밭
            </p>
            <div className="mt-1">
              <NameEditor currentName={profile?.name ?? ''} />
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            {profile?.is_admin && (
              <Link href="/admin" className="text-xs font-semibold text-gm-leaf hover:underline">
                관리자
              </Link>
            )}
            <form action={logoutAction}>
              <button className="text-xs text-gm-muted2 hover:text-gm-muted">로그아웃</button>
            </form>
          </div>
        </div>

        {dday !== null && (
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gm-fill px-3.5 py-1.5">
            <span className="text-[13px]">🗓️</span>
            <span className="text-xs font-bold text-gm-green">챌린지 마감까지 {dday}일</span>
          </div>
        )}

        {/* 작물 + 성장 상태바 (원본 이모지 유지) */}
        <div className="mt-4 rounded-[22px] border border-gm-line bg-white p-7 text-center">
          <div className="text-7xl leading-none">{growth.emoji}</div>
          <p className="mt-3 text-[15px] font-bold text-green-700">
            {growth.stage}단계 · {growth.stageName}
          </p>

          {/* 성장 상태바 */}
          <div className="mt-4">
            <div className="relative h-[26px] w-full overflow-hidden rounded-full bg-green-100">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${growth.percent}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gm-ink2">
                {totalKg.toFixed(2)} / {targetKg.toFixed(1)} kg CO₂
              </div>
            </div>
            <p className="mt-1.5 text-right text-[11px] text-gm-muted2">{growth.percent.toFixed(0)}% 달성</p>
            {!growth.harvested && toNext !== null && (
              <p className="mt-1.5 text-[13px] text-gm-muted">
                다음 단계까지 <b className="text-gm-green">{toNext.toFixed(2)}kg</b> 더 줄이면 돼요!
              </p>
            )}
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
        <div className="mt-3.5 grid grid-cols-3 gap-2.5">
          <StatCard label="누적 인증" value={`${count}`} unit="회" />
          <StatCard label="누적 이동" value={`${totalDistance.toFixed(1)}`} unit="km" />
          <StatCard label="누적 감축" value={`${totalKg.toFixed(2)}`} unit="kg" />
        </div>

        {/* 작물 성장 단계 슬라이더 (원본 그대로) */}
        <Reveal>
          <StageSlider targetKg={targetKg} totalKg={totalKg} />
        </Reveal>

        {/* 최근 인증 */}
        {recentRows.length > 0 && (
          <div className="mt-4">
            <div className="mb-2.5 flex items-center justify-between">
              <p className="text-sm font-bold text-gm-ink2">최근 인증</p>
              <Link href="/my" className="text-xs font-semibold text-gm-leaf hover:underline">
                전체 보기 →
              </Link>
            </div>
            <div className="flex flex-col gap-2">
              {recentRows.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-2xl border border-gm-line bg-white px-4 py-3"
                >
                  <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-gm-fill text-base">
                    {TRANSPORTS.find((t) => t.key === c.transport)?.icon ?? '🚶'}
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-gm-ink2">
                      {TRANSPORT_LABEL[c.transport as TransportKey]} · {Number(c.distance_km)}km
                    </p>
                    <p className="mt-0.5 text-[11px] text-gm-muted2">
                      {new Date(c.created_at).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} ·{' '}
                      {(Number(c.co2_reduced_g) / 1000).toFixed(2)}kg 감축
                    </p>
                  </div>
                  <StatusBadge status={c.status} processed={!!c.processed_at} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 작물 키우기 버튼 */}
        <Link
          href="/certify"
          className="mt-5 block rounded-full bg-gm-green py-4 text-center text-base font-bold text-white hover:opacity-90"
        >
          🚶 이동 인증하기
        </Link>

        {/* 인증 내용 보기 */}
        <Link
          href="/my"
          className="mt-2.5 block rounded-full border-[1.5px] border-[#bcd0a8] py-3 text-center text-sm font-bold text-gm-green hover:bg-gm-sage"
        >
          📋 인증 내용 보기
        </Link>

        {/* 이번 주 랭킹 (상위 6명) — Ranking.html 디자인 */}
        <Reveal>
          <WeeklyRanking items={ranking} weekLabel={weekLabel} />
        </Reveal>

        {/* 앱처럼 사용하기 (홈 화면에 추가 가이드) */}
        <Reveal>
          <AppGuide />
        </Reveal>
        <Reveal>
          <AndroidAppGuide />
        </Reveal>
      </div>
    </main>
  )
}

function StatCard({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl border border-gm-line bg-white px-2 py-3.5 text-center">
      <p className="text-[11px] text-gm-muted2">{label}</p>
      <p className="mt-1 text-lg font-bold text-gm-ink2">
        {value}
        <span className="text-xs">{unit}</span>
      </p>
    </div>
  )
}

function StatusBadge({ status, processed }: { status: string; processed: boolean }) {
  let label = '대기'
  let cls = 'bg-[#eeeee8] text-[#8a8d82]'
  if (status === 'rejected') {
    label = '반려'
    cls = 'bg-[#fde8e8] text-[#c0392b]'
  } else if (status === 'approved' && processed) {
    label = '승인'
    cls = 'bg-[#dcfce7] text-[#15803d]'
  }
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>{label}</span>
}
