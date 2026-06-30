// 핀 좌표 거리 계산 결정성 검증: node --env-file=.env.local scripts/test-coords.mjs
// "같은 좌표를 여러 번 넣으면 항상 같은 거리가 나오는가"를 확인.
const key = process.env.KAKAO_REST_API_KEY

async function routeKm(o, d) {
  const res = await fetch(
    `https://apis-navi.kakaomobility.com/v1/directions?origin=${o.lng},${o.lat}&destination=${d.lng},${d.lat}`,
    { headers: { Authorization: `KakaoAK ${key}` } }
  )
  if (!res.ok) return null
  const j = await res.json()
  const m = j.routes?.[0]?.summary?.distance
  return typeof m === 'number' ? Math.round((m / 1000) * 100) / 100 : null
}

// 고정 좌표 (전남대학교 / 광주역)
const A = { lat: 35.168423, lng: 126.891576 }
const B = { lat: 35.158293, lng: 126.84779 }

console.log('같은 좌표로 3회 거리 계산:')
const results = []
for (let i = 1; i <= 3; i++) {
  const km = await routeKm(A, B)
  results.push(km)
  console.log(`  ${i}회차: ${km} km`)
}
const allSame = results.every((r) => r === results[0])
console.log(allSame ? '✅ 3회 모두 동일 (결정적)' : '❌ 값이 달라짐')

// 약간 다른 좌표는 다른 값이 나오는지(정상성)
const B2 = { lat: 35.155, lng: 126.84 }
const km2 = await routeKm(A, B2)
console.log(`\n다른 도착 좌표: ${km2} km (위와 달라야 정상): ${km2 !== results[0] ? '✅' : '⚠️ 동일'}`)
console.log('\n=== 검증 끝 ===')
