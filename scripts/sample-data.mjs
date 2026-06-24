// 대시보드 미리보기용 샘플 인증 데이터 넣기/지우기 (임시)
// 넣기:  node --env-file=.env.local scripts/sample-data.mjs insert
// 지우기: node --env-file=.env.local scripts/sample-data.mjs clear
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const SAMPLE_NOTE = '__PREVIEW_SAMPLE__' // 나중에 이 표시로 골라 삭제

// 내 계정(주연서) 찾기
const { data: profiles } = await admin.from('profiles').select('id, name')
const me = profiles?.find((p) => p.name === '주연서') ?? profiles?.[0]
if (!me) {
  console.error('계정을 찾지 못했습니다. 먼저 회원가입을 해주세요.')
  process.exit(1)
}
console.log('대상 계정:', me.name, me.id)

const mode = process.argv[2]

if (mode === 'clear') {
  const { data, error } = await admin
    .from('certifications')
    .delete()
    .eq('user_id', me.id)
    .eq('start_address', SAMPLE_NOTE)
    .select('id')
  console.log(error ? '❌ ' + error.message : `✅ 샘플 ${data.length}건 삭제 완료`)
  process.exit(0)
}

if (mode === 'insert') {
  // 임시 배출계수 (settings와 동일): 차량 210 기준 감축량(g/km)
  const REDUCE = { walk: 210, bike: 210, bus: 182.3, subway: 208.47 }
  const samples = [
    { transport: 'walk', distance_km: 3.5 },
    { transport: 'subway', distance_km: 5.0 },
    { transport: 'bike', distance_km: 2.8 },
  ]
  const rows = samples.map((s) => ({
    user_id: me.id,
    transport: s.transport,
    start_address: SAMPLE_NOTE,
    end_address: SAMPLE_NOTE,
    distance_km: s.distance_km,
    co2_reduced_g: Math.round(REDUCE[s.transport] * s.distance_km * 100) / 100,
    status: 'approved',
  }))
  const { data, error } = await admin.from('certifications').insert(rows).select('co2_reduced_g')
  if (error) {
    console.error('❌', error.message)
    process.exit(1)
  }
  const totalG = data.reduce((s, r) => s + Number(r.co2_reduced_g), 0)
  console.log(`✅ 샘플 ${data.length}건 추가. 누적 감축량 ${(totalG / 1000).toFixed(2)}kg`)
  process.exit(0)
}

console.log('사용법: node --env-file=.env.local scripts/sample-data.mjs [insert|clear]')
