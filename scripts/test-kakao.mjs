// 카카오 거리 계산 검증: node --env-file=.env.local scripts/test-kakao.mjs
const key = process.env.KAKAO_REST_API_KEY
if (!key) {
  console.error('❌ KAKAO_REST_API_KEY가 .env.local에 없습니다.')
  process.exit(1)
}
const headers = { Authorization: `KakaoAK ${key}` }

async function geocode(query) {
  const a = await (
    await fetch(`https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`, { headers })
  ).json()
  if (a.documents?.length) return { lng: +a.documents[0].x, lat: +a.documents[0].y }
  const k = await (
    await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&x=126.8526&y=35.1601&radius=20000&sort=distance`, { headers })
  ).json()
  if (k.documents?.length) return { lng: +k.documents[0].x, lat: +k.documents[0].y }
  return null
}

function haversine(a, b) {
  const R = 6371, r = (d) => (d * Math.PI) / 180
  const dLat = r(b.lat - a.lat), dLng = r(b.lng - a.lng)
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

const startQ = '전남대학교', endQ = '광주역'
console.log(`1) 좌표 변환: "${startQ}", "${endQ}"`)
const s = await geocode(startQ)
const e = await geocode(endQ)
console.log('   시작:', s, '| 종료:', e)
if (!s || !e) {
  console.error('   ❌ 좌표 변환 실패 (키 또는 API 권한 확인 필요)')
  process.exit(1)
}
console.log('   ✅ 좌표 변환 성공')

console.log('2) 도로 경로 거리(카카오모빌리티) 시도...')
const navi = await fetch(
  `https://apis-navi.kakaomobility.com/v1/directions?origin=${s.lng},${s.lat}&destination=${e.lng},${e.lat}`,
  { headers }
)
if (navi.ok) {
  const j = await navi.json()
  const m = j.routes?.[0]?.summary?.distance
  console.log('   ✅ 도로 경로:', m ? (m / 1000).toFixed(2) + 'km' : '응답에 거리 없음')
} else {
  console.log(`   ⚠️ 길찾기 사용 불가(HTTP ${navi.status}) → 직선 거리로 대체됨`)
}
console.log('3) 직선 거리(대체용):', haversine(s, e).toFixed(2) + 'km')
console.log('\n=== 카카오 검증 끝 ===')
