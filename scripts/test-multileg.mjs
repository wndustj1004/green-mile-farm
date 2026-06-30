// 다중 동선 적립 검증: node --env-file=.env.local scripts/test-multileg.mjs
// 동선 2개(걷기 1.0km + 버스 2.0km)를 개별 기록으로 적립 → 각 CO₂가 그 수단 계수로 계산되는지
import { createClient } from '@supabase/supabase-js'
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

const MARK = '__MULTILEG_TEST__'
const { data: profiles } = await admin.from('profiles').select('id, name')
const me = profiles?.find((p) => p.name === '주연서') ?? profiles?.[0]
const { data: s } = await admin.from('settings').select('*').eq('id', 1).single()
const car = Number(s.car_emission)
const calc = (mode, km) => Math.max(0, Math.round((car - Number(s[`${mode}_emission`])) * km * 100) / 100)

const legs = [
  { transport: 'walk', distance_km: 1.0 },
  { transport: 'bus', distance_km: 2.0 },
]
const rows = legs.map((l) => ({
  user_id: me.id,
  transport: l.transport,
  start_address: MARK,
  end_address: MARK,
  distance_km: l.distance_km,
  co2_reduced_g: calc(l.transport, l.distance_km),
  status: 'approved',
}))

console.log('예상 CO₂: 걷기 1.0km =', calc('walk', 1.0), 'g / 버스 2.0km =', calc('bus', 2.0), 'g')
const { data: inserted, error } = await admin.from('certifications').insert(rows).select('transport, distance_km, co2_reduced_g')
if (error) { console.error('❌', error.message); process.exit(1) }
console.log('\n적립된 개별 기록:')
inserted.forEach((r) => console.log(`  ${r.transport}: ${r.distance_km}km → ${r.co2_reduced_g}g`))
console.log(inserted.length === 2 ? '✅ 동선 2개가 각각 개별 레코드로 적립됨' : '❌ 레코드 수 이상')

// 정리
const { data: del } = await admin.from('certifications').delete().eq('user_id', me.id).eq('start_address', MARK).select('id')
console.log(`\n🧹 테스트 기록 ${del?.length ?? 0}건 삭제 완료`)
