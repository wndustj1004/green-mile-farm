// 건물 단위 거리 검증: node --env-file=.env.local scripts/test-coords.mjs
// ~30m 격자 스냅: ① 같은 지점 손떨림 → 같은 거리 ② 다른 건물 → 다른 거리 (캠퍼스 합쳐짐 방지)
const key = process.env.KAKAO_REST_API_KEY
const H = { headers: { Authorization: `KakaoAK ${key}` } }

const SNAP_DEG = 0.0003
const snap = (v) => Math.round(v / SNAP_DEG) * SNAP_DEG
const sn = (p) => ({ lat: snap(p.lat), lng: snap(p.lng) })

async function route(o, d) {
  const r = await fetch(
    `https://apis-navi.kakaomobility.com/v1/directions?origin=${o.lng},${o.lat}&destination=${d.lng},${d.lat}`,
    H
  )
  if (!r.ok) return null
  const j = await r.json()
  const m = j.routes?.[0]?.summary?.distance
  return typeof m === 'number' ? Math.round(m / 10) / 100 : null
}

const START = { lat: 35.16842, lng: 126.89158 } // 전남대 정문 부근
const prime = { lat: 35.17439, lng: 126.90326 } // 프라임홀
const lib = { lat: 35.17653, lng: 126.9058 }    // 중앙도서관
const eng7 = { lat: 35.17825, lng: 126.90926 }  // 공과대학 7호관

// 같은 지점 미세 손떨림 5회(±약 10m)
const jit = [[0, 0], [0.0001, 0.00005], [-0.0001, 0.00008], [0.00008, -0.0001], [-0.00009, -0.00006]]
console.log('① 같은 지점(프라임홀) 5회 손떨림:')
const ds = []
for (const [dy, dx] of jit) {
  const d = await route(START, sn({ lat: prime.lat + dy, lng: prime.lng + dx }))
  ds.push(d)
  console.log('  ', d, 'km')
}
console.log(ds.every((d) => d === ds[0]) ? '  ✅ 모두 동일' : '  ❌ 다름')

console.log('\n② 같은 캠퍼스(용봉로 77) 다른 건물 → 다른 거리여야 정상:')
const a = await route(START, sn(prime))
const b = await route(START, sn(lib))
const c = await route(START, sn(eng7))
console.log(`  프라임홀=${a} / 중앙도서관=${b} / 공과7호관=${c}`)
console.log(a !== b && b !== c && a !== c ? '  ✅ 건물마다 다른 거리' : '  ❌ 일부 동일')
