import { createClient } from '@/lib/supabase/server'
import { TRANSPORT_LABEL, type TransportKey } from '@/lib/transport'

export const dynamic = 'force-dynamic'

export default async function AdminStatsPage() {
  const supabase = createClient()

  const { data: settings } = await supabase.from('settings').select('target_co2_kg').eq('id', 1).single()
  const targetKg = Number(settings?.target_co2_kg ?? 5)

  const { count: signupCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  const { data: certs } = await supabase
    .from('certifications')
    .select('user_id, transport, distance_km, co2_reduced_g, status')

  const approved = (certs ?? []).filter((c) => c.status === 'approved')

  // 참가자(승인 인증 1건 이상) + 1인당 누적
  const perUser = new Map<string, number>()
  for (const c of approved) {
    perUser.set(c.user_id, (perUser.get(c.user_id) ?? 0) + Number(c.co2_reduced_g))
  }
  const participantCount = perUser.size
  const harvestCount = Array.from(perUser.values()).filter((g) => g / 1000 >= targetKg).length

  // 교통수단 비율
  const byTransport: Record<string, number> = {}
  for (const c of approved) byTransport[c.transport] = (byTransport[c.transport] ?? 0) + 1

  const totalReducedKg = approved.reduce((s, c) => s + Number(c.co2_reduced_g), 0) / 1000

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">통계</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="가입자 수" value={`${signupCount ?? 0}명`} />
        <Stat label="참가자 수" value={`${participantCount}명`} />
        <Stat label="승인 인증 건수" value={`${approved.length}건`} />
        <Stat label="수확 달성자" value={`${harvestCount}명`} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Stat label="총 감축량(승인)" value={`${totalReducedKg.toFixed(2)} kg CO₂`} />
        <Stat label="목표 감축량" value={`${targetKg} kg / 1인`} />
      </div>

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
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="mt-1 text-lg font-bold text-green-700">{value}</p>
    </div>
  )
}
