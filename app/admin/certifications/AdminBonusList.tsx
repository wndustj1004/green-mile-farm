import {
  formatAwardedAt,
  formatPeriod,
  kindInfo,
  sumSettledKg,
  type AdminBonusAward,
} from '@/lib/bonus'

/**
 * 관리자 > 인증 내역 > 🎁 보너스 탭
 * 어떤 보너스로 누구에게 몇 kg이 언제 추가 적립됐는지 표로 보여줍니다.
 * (보너스는 인증 기록에서 계산되므로 별도 승인/취소 조작은 없습니다 — 조회 전용)
 */
export default function AdminBonusList({ awards }: { awards: AdminBonusAward[] }) {
  const settled = awards.filter((b) => b.settled)
  const upcoming = awards.filter((b) => !b.settled)
  const totalKg = sumSettledKg(awards)
  const upcomingKg = upcoming.reduce((s, b) => s + b.amount_g, 0) / 1000

  // 사람별 합계 (확정분 기준, 많은 순)
  const perUser = new Map<string, { name: string; username: string; kg: number; n: number }>()
  for (const b of settled) {
    const cur = perUser.get(b.user_id) ?? { name: b.name, username: b.username, kg: 0, n: 0 }
    cur.kg += b.amount_g / 1000
    cur.n++
    perUser.set(b.user_id, cur)
  }
  const userRows = Array.from(perUser.values()).sort((a, b) => b.kg - a.kg)

  // 화면에 등장한 보너스 종류 설명
  const notes = Array.from(new Set(awards.map((b) => b.kind))).map((k) => kindInfo(k))

  if (awards.length === 0) {
    return (
      <p className="rounded-xl bg-white p-6 text-center text-sm text-gray-400">
        아직 적립된 보너스가 없습니다.
        <br />
        <span className="text-xs">
          한 주(월~일)가 끝나면 그 주 감축량 상위 3명에게 자동으로 적립됩니다.
        </span>
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* 요약 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="확정 적립 총량" value={`+${totalKg.toFixed(2)} kg`} highlight />
        <Stat label="확정 적립 건수" value={`${settled.length}건`} />
        <Stat
          label="적립 예정(진행 중인 주)"
          value={upcoming.length ? `+${upcomingKg.toFixed(2)} kg · ${upcoming.length}건` : '없음'}
        />
      </div>

      {/* 사람별 합계 */}
      {userRows.length > 0 && (
        <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
          <table className="w-full text-sm">
            <caption className="px-3 pt-3 text-left text-sm font-semibold text-gray-700">
              참가자별 보너스 합계 (확정분)
            </caption>
            <thead>
              <tr className="border-b text-left text-xs text-gray-400">
                <th className="px-3 py-2">이름</th>
                <th className="px-3 py-2">아이디</th>
                <th className="px-3 py-2 text-right">보너스 건수</th>
                <th className="px-3 py-2 text-right">추가 적립량</th>
              </tr>
            </thead>
            <tbody>
              {userRows.map((u) => (
                <tr key={u.username} className="border-b last:border-0">
                  <td className="px-3 py-2 font-medium text-gray-800">{u.name}</td>
                  <td className="px-3 py-2 text-gray-500">@{u.username}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{u.n}건</td>
                  <td className="px-3 py-2 text-right font-semibold text-amber-700">
                    +{u.kg.toFixed(2)} kg
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 상세 내역 */}
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-sm">
          <caption className="px-3 pt-3 text-left text-sm font-semibold text-gray-700">
            보너스 적립 상세
          </caption>
          <thead>
            <tr className="border-b text-left text-xs text-gray-400">
              <th className="px-3 py-2">적립 날짜</th>
              <th className="px-3 py-2">대상 기간</th>
              <th className="px-3 py-2">참가자</th>
              <th className="px-3 py-2">보너스 이벤트</th>
              <th className="px-3 py-2">산정 근거</th>
              <th className="px-3 py-2 text-right">적립량</th>
              <th className="px-3 py-2 text-center">상태</th>
            </tr>
          </thead>
          <tbody>
            {[...settled, ...upcoming].map((b, i) => {
              const info = kindInfo(b.kind)
              return (
                <tr
                  key={`${b.user_id}-${b.kind}-${b.period_start}-${i}`}
                  className={`border-b last:border-0 ${b.settled ? '' : 'bg-gray-50'}`}
                >
                  <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                    {formatAwardedAt(b.awarded_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                    {formatPeriod(b.period_start, b.period_end)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <b className="text-gray-800">{b.name}</b>{' '}
                    <span className="text-gray-400">@{b.username}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                    {info.icon} {b.title}
                  </td>
                  <td className="px-3 py-2 text-xs text-gray-500">{b.detail}</td>
                  <td
                    className={`whitespace-nowrap px-3 py-2 text-right font-semibold ${
                      b.settled ? 'text-amber-700' : 'text-gray-400'
                    }`}
                  >
                    +{(b.amount_g / 1000).toFixed(2)} kg
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.settled ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {b.settled ? '적립 완료' : '적립 예정'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 제도 설명 */}
      {notes.map((n) => (
        <p key={n.label} className="rounded-xl bg-white p-4 text-xs leading-relaxed text-gray-500 shadow-sm">
          <b className="text-gray-700">
            {n.icon} {n.label}
          </b>
          <br />
          {n.note}
          <br />
          보너스는 인증 기록에서 자동 계산됩니다. 인증을 반려하거나 이동거리를 수정하면 해당 주의
          보너스도 함께 다시 계산됩니다.
        </p>
      ))}
    </div>
  )
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-lg font-bold ${highlight ? 'text-amber-700' : 'text-gray-700'}`}>
        {value}
      </p>
    </div>
  )
}
