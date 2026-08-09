import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TRANSPORT_LABEL, type TransportKey } from '@/lib/transport'
import { toBonusAward, sumSettledKg, type BonusAward } from '@/lib/bonus'
import MyCertsList, { type CertRow } from './MyCertsList'

export const dynamic = 'force-dynamic'

export default async function MyCertsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 본인 인증만 (RLS도 본인으로 제한되지만 명시적으로 필터)
  const { data: certs } = await supabase
    .from('certifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  const rows = certs ?? []

  // 교통수단별 비율(승인된 것 기준)
  const approved = rows.filter((c) => c.status === 'approved')
  const byTransport: Record<string, number> = {}
  for (const c of approved) byTransport[c.transport] = (byTransport[c.transport] ?? 0) + 1
  const baseKg = approved.reduce((s, c) => s + Number(c.co2_reduced_g), 0) / 1000

  // 보너스 적립 내역 (주간 랭킹 등) — 확정된 것만 누적 감축에 더함
  const { data: bonusRaw } = await supabase.rpc('my_bonus_awards')
  const bonuses: BonusAward[] = Array.isArray(bonusRaw)
    ? (bonusRaw as Record<string, unknown>[]).map(toBonusAward)
    : []
  const bonusKg = sumSettledKg(bonuses)
  // 대시보드의 누적 감축량과 같은 기준(기본 + 확정 보너스)
  const totalKg = baseKg + bonusKg

  // 사진 서명 URL
  const paths: string[] = []
  for (const c of rows) {
    for (const p of [c.start_photo_1, c.start_photo_2, c.end_photo_1, c.end_photo_2]) if (p) paths.push(p)
  }
  const urlMap = new Map<string, string>()
  if (paths.length) {
    const { data: signed } = await supabase.storage.from('certification-photos').createSignedUrls(paths, 3600)
    signed?.forEach((s) => {
      if (s.path && s.signedUrl) urlMap.set(s.path, s.signedUrl)
    })
  }

  // 클라이언트로 넘길 직렬화 데이터
  const certRows: CertRow[] = rows.map((c) => ({
    id: c.id,
    transport: c.transport,
    distanceKm: Number(c.distance_km),
    co2Kg: Number(c.co2_reduced_g) / 1000,
    status: c.status,
    processed: !!c.processed_at,
    rejectReason: c.reject_reason ?? null,
    startAddress: c.start_address ?? '시작',
    endAddress: c.end_address ?? '종료',
    createdAt: c.created_at,
    processedAt: c.processed_at ?? null,
    photos: [c.start_photo_1, c.start_photo_2, c.end_photo_1, c.end_photo_2].map((p) =>
      p ? urlMap.get(p) ?? null : null
    ),
  }))

  return (
    <main className="min-h-screen bg-gm-cream2 px-5 py-7">
      <div className="mx-auto max-w-2xl">
        <Link href="/dashboard" className="text-[13px] text-gm-muted2 hover:text-gm-muted">
          ← 대시보드
        </Link>
        <h1 className="mt-3.5 text-[22px] font-bold tracking-tight text-gm-ink2">내 인증 내용 📋</h1>

        {/* 상단 요약 */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          <Summary label="총 인증" value={`${rows.length}`} unit="건" />
          <Summary label="승인됨" value={`${approved.length}`} unit="건" green />
          <Summary label="누적 감축" value={totalKg.toFixed(2)} unit="kg" />
        </div>

        {/* 누적 감축량 = 인증 감축 + 확정 보너스 (대시보드 숫자와 동일) */}
        {bonusKg > 0 && (
          <p className="mt-2 text-center text-[11px] text-gm-muted2">
            누적 감축 = 인증 {baseKg.toFixed(2)}kg + 보너스{' '}
            <b className="text-gm-green">{bonusKg.toFixed(2)}kg</b>
          </p>
        )}

        {/* 교통수단별 비율 */}
        <div className="mt-3.5 rounded-[18px] border border-gm-line bg-white p-[18px]">
          <p className="mb-3.5 text-sm font-bold text-gm-ink2">교통수단별 인증 비율</p>
          {approved.length === 0 ? (
            <p className="text-sm text-gm-muted2">아직 승인된 인증이 없습니다.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {(['walk', 'bike', 'bus', 'subway'] as TransportKey[]).map((t) => {
                const n = byTransport[t] ?? 0
                const pct = approved.length ? Math.round((n / approved.length) * 100) : 0
                return (
                  <div key={t} className="flex items-center gap-2.5 text-xs">
                    <span className="w-9 text-gm-muted">{TRANSPORT_LABEL[t]}</span>
                    <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-gm-sage">
                      <div className="h-full rounded-full bg-gm-leaf" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-14 text-right text-gm-muted2">{n}건 ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 상태 필터(승인·대기·반려·보너스) + 내역 */}
        <MyCertsList rows={certRows} bonuses={bonuses} />
      </div>
    </main>
  )
}

function Summary({ label, value, unit, green }: { label: string; value: string; unit: string; green?: boolean }) {
  return (
    <div className="rounded-2xl border border-gm-line bg-white px-2 py-3.5 text-center">
      <p className="text-[11px] text-gm-muted2">{label}</p>
      <p className={`mt-1 text-lg font-bold ${green ? 'text-[#15803d]' : 'text-gm-ink2'}`}>
        {value}
        <span className="text-xs">{unit}</span>
      </p>
    </div>
  )
}
