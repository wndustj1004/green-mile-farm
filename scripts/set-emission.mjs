// 교통수단별 배출계수(g CO2/km) 변경
// 사용법: node --env-file=.env.local scripts/set-emission.mjs <수단> <값>
//   예)  node --env-file=.env.local scripts/set-emission.mjs subway 1.53
//   수단: car | walk | bike | bus | subway
// ※ 관리자 페이지(/admin/settings)에서도 같은 작업을 할 수 있습니다.
// ※ 과거 인증의 감축량은 그대로 유지됩니다(소급 재계산 안 함). 새 인증부터 적용됩니다.
import { createClient } from '@supabase/supabase-js'

const COLUMN = {
  car: 'car_emission',
  walk: 'walk_emission',
  bike: 'bike_emission',
  bus: 'bus_emission',
  subway: 'subway_emission',
}

const mode = process.argv[2]
const value = Number(process.argv[3])
if (!COLUMN[mode] || !Number.isFinite(value) || value < 0) {
  console.error('사용법: node --env-file=.env.local scripts/set-emission.mjs <car|walk|bike|bus|subway> <값>')
  process.exit(1)
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const { data: before, error: readErr } = await admin
  .from('settings')
  .select('*')
  .eq('id', 1)
  .single()
if (readErr) {
  console.error('❌ 설정을 읽지 못했습니다: ' + readErr.message)
  process.exit(1)
}

const { data, error } = await admin
  .from('settings')
  .update({ [COLUMN[mode]]: value, updated_at: new Date().toISOString() })
  .eq('id', 1)
  .select('*')

if (error) {
  console.error('❌ ' + error.message)
  process.exit(1)
}

const after = data[0]
console.log(`✅ ${mode} 배출계수 변경: ${before[COLUMN[mode]]} → ${after[COLUMN[mode]]} g/km`)
console.log(
  `   현재 계수 — 승용차 ${after.car_emission} / 걷기 ${after.walk_emission} / 자전거 ${after.bike_emission} / 버스 ${after.bus_emission} / 지하철 ${after.subway_emission}`
)
console.log(
  `   1km당 감축량 — 걷기 ${(after.car_emission - after.walk_emission).toFixed(2)} / 자전거 ${(after.car_emission - after.bike_emission).toFixed(2)} / 버스 ${(after.car_emission - after.bus_emission).toFixed(2)} / 지하철 ${(after.car_emission - after.subway_emission).toFixed(2)} g`
)
