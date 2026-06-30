import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TRANSPORT_LABEL, type TransportKey } from '@/lib/transport'

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">← 대시보드</Link>
          <span className="font-bold text-green-700">📋 내 인증 내용</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6">
        {/* 교통수단별 비율 차트 (관리자 통계와 동일 형태) */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">교통수단별 인증 비율</h2>
          {approved.length === 0 ? (
            <p className="text-sm text-gray-400">아직 승인된 인증이 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {(['walk', 'bike', 'bus', 'subway'] as TransportKey[]).map((t) => {
                const n = byTransport[t] ?? 0
                const pct = approved.length ? Math.round((n / approved.length) * 100) : 0
                return (
                  <div key={t} className="flex items-center gap-3 text-sm">
                    <span className="w-12 text-gray-600">{TRANSPORT_LABEL[t]}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-green-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-16 text-right text-gray-500">{n}건 ({pct}%)</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 인증 내역 카드 */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">인증 내역 ({rows.length}건)</h2>
          {rows.length === 0 && <p className="text-sm text-gray-400">아직 인증이 없습니다.</p>}

          {rows.map((c) => {
            const photos = [c.start_photo_1, c.start_photo_2, c.end_photo_1, c.end_photo_2]
            return (
              <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-gray-800">
                    {TRANSPORT_LABEL[c.transport as TransportKey]} · {Number(c.distance_km)}km ·{' '}
                    {(Number(c.co2_reduced_g) / 1000).toFixed(2)}kg CO₂
                  </span>
                  <StatusBadge status={c.status} processed={!!c.processed_at} />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  {c.start_address || '시작'} → {c.end_address || '종료'}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  {photos.map((p, i) =>
                    p && urlMap.get(p) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={i} href={urlMap.get(p)} target="_blank" rel="noreferrer">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={urlMap.get(p)} alt={`photo${i}`} className="h-20 w-20 rounded-lg object-cover" />
                      </a>
                    ) : (
                      <div key={i} className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">없음</div>
                    )
                  )}
                </div>

                <p className="mt-2 text-xs text-gray-400">
                  업로드: {new Date(c.created_at).toLocaleString('ko-KR')}
                  {c.processed_at && ` · 처리: ${new Date(c.processed_at).toLocaleString('ko-KR')}`}
                </p>
                {c.status === 'rejected' && c.reject_reason && (
                  <p className="mt-1 text-xs text-red-500">반려 사유: {c.reject_reason}</p>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}

// 승인/반려/대기 — 자동승인됐지만 운영진 확인 전이면 '대기'
function StatusBadge({ status, processed }: { status: string; processed: boolean }) {
  let label = '대기'
  let cls = 'bg-gray-100 text-gray-500'
  if (status === 'rejected') {
    label = '반려'
    cls = 'bg-red-100 text-red-600'
  } else if (status === 'approved' && processed) {
    label = '승인'
    cls = 'bg-green-100 text-green-700'
  }
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
}
