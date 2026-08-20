// 보너스 적립이 제대로 계산되는지 확인 (읽기 전용 — 데이터를 바꾸지 않습니다)
// 사용법: node --env-file=.env.local scripts/check-bonus.mjs
//
// supabase/12_bonus_awards.sql 을 SQL Editor에서 실행한 뒤 이 스크립트를 돌리면
// 주별 순위 → 보너스 → 누적 감축량이 서로 맞는지 한눈에 확인할 수 있습니다.
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const { data: settings } = await admin.from('settings').select('*').eq('id', 1).single()
const targetG = Number(settings.target_co2_kg) * 1000
console.log(`목표 감축량 ${settings.target_co2_kg}kg · 챌린지 ${settings.challenge_start} ~ ${settings.challenge_end}\n`)

const { data: profiles } = await admin.from('profiles').select('id, name, username')
const nameOf = new Map(profiles.map((p) => [p.id, `${p.name}(@${p.username})`]))

const { data: certs } = await admin
  .from('certifications')
  .select('user_id, co2_reduced_g, created_at, id')
  .eq('status', 'approved')
  .order('created_at', { ascending: true })

// 한국시간 기준 그 주 월요일 (DB의 date_trunc('week', ... at time zone 'Asia/Seoul')와 동일)
function weekStartKST(iso) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000)
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7))
  d.setUTCHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

const totals = new Map()
for (const c of certs) totals.set(c.user_id, (totals.get(c.user_id) ?? 0) + Number(c.co2_reduced_g))

const weekly = new Map()
for (const c of certs) {
  const wk = weekStartKST(c.created_at)
  if (!weekly.has(wk)) weekly.set(wk, new Map())
  const m = weekly.get(wk)
  m.set(c.user_id, (m.get(c.user_id) ?? 0) + Number(c.co2_reduced_g))
}

const curWk = weekStartKST(new Date().toISOString())
// 오늘(한국시간) 날짜 — 챌린지 마감 여부 판정용
const todayKST = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)
// 마감일이 지났으면 남은 주도 확정으로 본다 (14번 SQL 규칙과 동일)
const challengeOver = !!settings.challenge_end && todayKST > settings.challenge_end
if (challengeOver)
  console.log(`※ 챌린지 마감(${settings.challenge_end}) 이후 — 남은 주도 확정 처리됩니다.
`)
const expected = new Map() // user -> 확정 보너스 합계(g)

console.log('=== 주별 랭킹과 보너스 (수확 도달자 제외) ===')
for (const wk of [...weekly.keys()].sort()) {
  const done = wk < curWk || challengeOver
  const rows = [...weekly.get(wk).entries()]
    .filter(([uid]) => (totals.get(uid) ?? 0) < targetG)
    .sort((a, b) => b[1] - a[1])
  console.log(`\n■ ${wk} 주 ${done ? '(완료 → 보너스 확정)' : '(진행 중 → 적립 예정)'}`)
  if (rows.length === 0) console.log('   (대상자 없음)')
  rows.forEach(([uid, g], i) => {
    let mark = ''
    if (i < 3) {
      const b = g * 0.5
      mark = done ? `  → 보너스 +${(b / 1000).toFixed(3)}kg` : `  → 예정 +${(b / 1000).toFixed(3)}kg`
      if (done) expected.set(uid, (expected.get(uid) ?? 0) + b)
    }
    console.log(`   ${i + 1}위 ${nameOf.get(uid) ?? uid}  주간 ${(g / 1000).toFixed(3)}kg${mark}`)
  })
}

// 보너스 ② 우리 관계 steady♡ — 승인 인증 3회 달성 시 1kg (1인 1회)
const STEADY_N = 3
const STEADY_G = 1000
console.log('\n=== 우리 관계 steady♡ (승인 인증 3회 달성 → +1kg, 1인 1회) ===')
const seq = new Map()
for (const c of certs) {
  if (!seq.has(c.user_id)) seq.set(c.user_id, [])
  seq.get(c.user_id).push(c)
}
let steadyN = 0
for (const [uid, list] of [...seq.entries()].sort((a, b) => b[1].length - a[1].length)) {
  if (list.length >= STEADY_N) {
    steadyN++
    expected.set(uid, (expected.get(uid) ?? 0) + STEADY_G)
    console.log(
      `   ✔ ${nameOf.get(uid) ?? uid}  승인 ${list.length}회` +
        `  → 보너스 +${(STEADY_G / 1000).toFixed(2)}kg (${list[STEADY_N - 1].created_at.slice(0, 10)} 달성)`
    )
  } else {
    console.log(`   · ${nameOf.get(uid) ?? uid}  승인 ${list.length}회  → ${STEADY_N - list.length}회 더 필요`)
  }
}
console.log(`   합계: ${steadyN}명 · +${((steadyN * STEADY_G) / 1000).toFixed(2)}kg`)

console.log('\n=== effective_reduction_g() 검산 (인증 + 확정 보너스) ===')
let bad = 0
for (const [uid, raw] of totals) {
  const want = raw + (expected.get(uid) ?? 0)
  const { data: eff, error } = await admin.rpc('effective_reduction_g', { uid })
  if (error) {
    console.log(`${(nameOf.get(uid) ?? uid).padEnd(24)} ❌ ${error.message}`)
    bad++
    continue
  }
  const ok = Math.abs(Number(eff) - want) < 0.5 // 0.5g 이내면 일치
  if (!ok) bad++
  console.log(
    `${ok ? '✅' : '❌'} ${(nameOf.get(uid) ?? uid).padEnd(24)} 인증 ${(raw / 1000).toFixed(3)}kg` +
      ` + 보너스 ${((expected.get(uid) ?? 0) / 1000).toFixed(3)}kg` +
      ` = ${(want / 1000).toFixed(3)}kg  |  DB ${(Number(eff) / 1000).toFixed(3)}kg`
  )
}

console.log('\n=== admin_bonus_awards() 응답 확인 ===')
const { data: awards, error: ae } = await admin.rpc('admin_bonus_awards')
if (ae) {
  console.log(`❌ ${ae.message}  (12_bonus_awards.sql 을 아직 실행하지 않았을 수 있습니다)`)
} else {
  // service_role 은 auth.uid()가 없어 is_admin()=false → 빈 배열이 정상입니다.
  console.log(`함수 정상 동작 (반환 ${Array.isArray(awards) ? awards.length : 0}건)`)
  console.log('※ 이 스크립트는 로그인 사용자가 아니라서 빈 배열이 나옵니다. 실제 목록은 관리자 화면에서 확인하세요.')
}

console.log(bad === 0 ? '\n🟢 보너스 계산 일치 — 이상 없음' : `\n🔴 불일치 ${bad}건 — 위 ❌ 항목을 확인하세요`)
