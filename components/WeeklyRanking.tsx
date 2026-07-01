export type RankItem = {
  rank: number
  name: string
  email_id: string
  weekly_kg: number
  bonus: boolean
}

const ANIMAL: Record<number, string> = { 1: '🦊', 2: '🐻', 3: '🐼', 4: '🐨', 5: '🐸', 6: '🦁' }
const BAR: Record<number, string> = { 1: 'bg-[#7cb47f]', 2: 'bg-[#a9cce8]', 3: 'bg-[#ebc94e]' }
const RING: Record<number, string> = { 1: 'ring-[#7cb47f]', 2: 'ring-[#a9cce8]', 3: 'ring-[#ebc94e]' }
const HEIGHT: Record<number, string> = { 1: 'h-36', 2: 'h-28', 3: 'h-24' }

// Ranking.html 디자인: 상단 1·2·3위 단상(포디움) + 4~6위 리스트
export default function WeeklyRanking({ items, weekLabel }: { items: RankItem[]; weekLabel: string }) {
  if (items.length === 0) return null

  const podium = items.filter((i) => i.rank <= 3)
  const rest = items.filter((i) => i.rank >= 4)
  const podiumOrdered = [2, 1, 3]
    .map((rk) => podium.find((i) => i.rank === rk))
    .filter((x): x is RankItem => !!x)
  const maxKg = items[0]?.weekly_kg || 1

  return (
    <div className="mt-8 rounded-3xl border border-gm-line bg-white p-5 sm:p-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-gm-muted2">Weekly Ranking</p>
          <h2 className="mt-1 text-xl font-extrabold tracking-tight text-gm-ink">
            이번 주{' '}
            <span className="rounded-md bg-[#cdeccb] px-1.5 py-0.5 text-gm-green">탄소 절감</span> 랭킹
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-gm-muted">
            상위 3등까지는 이번 주 CO₂ 감축량의 <b className="text-gm-green">50%</b>를 추가로 적립해드려요!
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-[#eaf4e6] px-3 py-1 text-xs font-semibold text-gm-green">
          📅 {weekLabel}
        </span>
      </div>

      {/* 포디움 */}
      <div className="mt-6 flex items-end justify-center gap-2.5">
        {podiumOrdered.map((p) => (
          <div key={p.rank} className="flex w-[30%] max-w-[120px] flex-col items-center">
            <div className="h-5 text-lg leading-none">{p.rank === 1 ? '👑' : ''}</div>
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-full bg-gm-cream2 text-2xl ring-2 ${RING[p.rank]}`}
              aria-hidden
            >
              {ANIMAL[p.rank]}
            </div>
            <p className="mt-1.5 text-center text-xs font-bold text-gm-ink2">{p.name}</p>
            <p className="text-[10px] text-gm-muted2">({p.email_id})</p>
            <p className="mt-0.5 text-xs font-bold text-gm-green">
              {p.weekly_kg.toFixed(1)}
              <span className="text-[9px]">kg</span>
            </p>
            <div className={`mt-1.5 flex w-full items-center justify-center rounded-t-xl ${HEIGHT[p.rank]} ${BAR[p.rank]}`}>
              <span className="text-2xl font-extrabold text-white">{p.rank}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 4~6위 리스트 */}
      {rest.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {rest.map((r) => {
            const pct = Math.min(100, Math.round((r.weekly_kg / maxKg) * 100))
            return (
              <div key={r.rank} className="rounded-2xl bg-gm-cream2 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="w-4 text-center text-sm font-bold text-gm-muted2">{r.rank}</span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-base" aria-hidden>
                    {ANIMAL[r.rank]}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-bold text-gm-ink2">
                    {r.name} <span className="text-[11px] font-normal text-gm-muted2">({r.email_id})</span>
                  </p>
                  <p className="text-sm font-bold text-gm-ink2">
                    {r.weekly_kg.toFixed(1)}
                    <span className="text-[10px]">kg</span>
                  </p>
                </div>
                <div className="ml-11 mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#7cb47f]" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="mt-3 text-[11px] text-gm-muted2">※ 수확을 달성한 참가자는 랭킹에서 제외됩니다.</p>
    </div>
  )
}
