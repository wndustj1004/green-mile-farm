// =============================================================
//  보너스 적립 내역 공통 타입·표시 규칙
//  DB 함수 my_bonus_awards() / admin_bonus_awards() 가 돌려주는 형태와 1:1 대응.
//  (SQL: supabase/12_bonus_awards.sql)
//
//  ※ 새 보너스 제도를 추가할 때는 SQL 쪽에 kind 값을 추가하고
//    아래 BONUS_KIND 에 라벨·아이콘만 등록하면 화면은 그대로 동작합니다.
// =============================================================

export type BonusAward = {
  kind: string
  title: string // 예) 주간 랭킹 1위
  detail: string // 예) 해당 주 감축량 4.79kg 의 50%
  period_start: string // YYYY-MM-DD (대상 기간 시작)
  period_end: string // YYYY-MM-DD (대상 기간 끝)
  awarded_at: string // ISO (적립 확정 시각)
  base_g: number // 산정 기준 감축량(g)
  amount_g: number // 추가 적립된 감축량(g)
  rank_no: number | null
  settled: boolean // true=확정 적립 / false=진행 중(예정)
}

export type AdminBonusAward = BonusAward & {
  user_id: string
  name: string
  username: string
}

/** 보너스 종류별 표시 정보 — 제도를 추가하면 여기에 한 줄 추가 */
export const BONUS_KIND: Record<string, { icon: string; label: string; note: string }> = {
  weekly_rank: {
    icon: '🏆',
    label: '주간 랭킹 보너스',
    note: '한 주(월~일) 감축량 상위 3명에게 그 주 감축량의 50%를 추가로 적립합니다. 주가 끝나야 순위가 확정되므로, 진행 중인 주는 “적립 예정”으로 표시됩니다.',
  },
}

export function kindInfo(kind: string) {
  return BONUS_KIND[kind] ?? { icon: '🎁', label: '보너스', note: '' }
}

/** JSON(any) → BonusAward 로 안전 변환 (숫자 문자열로 오는 경우 대비) */
export function toBonusAward(r: Record<string, unknown>): BonusAward {
  return {
    kind: String(r.kind ?? ''),
    title: String(r.title ?? '보너스'),
    detail: String(r.detail ?? ''),
    period_start: String(r.period_start ?? ''),
    period_end: String(r.period_end ?? ''),
    awarded_at: String(r.awarded_at ?? ''),
    base_g: Number(r.base_g ?? 0),
    amount_g: Number(r.amount_g ?? 0),
    rank_no: r.rank_no == null ? null : Number(r.rank_no),
    settled: !!r.settled,
  }
}

export function toAdminBonusAward(r: Record<string, unknown>): AdminBonusAward {
  return {
    ...toBonusAward(r),
    user_id: String(r.user_id ?? ''),
    name: String(r.name ?? '?'),
    username: String(r.username ?? '?'),
  }
}

/** 2026-07-06 ~ 2026-07-12 → "7월 6일 ~ 7월 12일" */
export function formatPeriod(start: string, end: string) {
  const f = (s: string) => {
    const [, m, d] = s.split('-')
    return `${Number(m)}월 ${Number(d)}일`
  }
  if (!start || !end) return ''
  return `${f(start)} ~ ${f(end)}`
}

/**
 * 적립 시각 → "2026년 7월 13일" (한국시간 기준)
 * 주간 보너스는 항상 월요일 0시에 확정되므로 자정이면 시각을 생략합니다.
 * 보는 사람의 기기 시간대와 무관하게 항상 한국시간으로 표시합니다.
 */
export function formatAwardedAt(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const kst = new Date(d.getTime() + 9 * 3600 * 1000)
  const isMidnight = kst.getUTCHours() === 0 && kst.getUTCMinutes() === 0
  return d.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...(isMidnight ? {} : { hour: '2-digit' as const, minute: '2-digit' as const }),
  })
}

export function sumSettledKg(list: { amount_g: number; settled: boolean }[]) {
  return list.filter((b) => b.settled).reduce((s, b) => s + b.amount_g, 0) / 1000
}
