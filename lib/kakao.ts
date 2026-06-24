// 서버 전용: 카카오 REST API로 주소→좌표 변환 + 거리 계산.
// KAKAO_REST_API_KEY(.env.local)만 있으면 동작. 브라우저에서 import 금지.

type Coord = { lng: number; lat: number }

async function geocode(query: string): Promise<Coord | null> {
  const key = process.env.KAKAO_REST_API_KEY!
  const headers = { Authorization: `KakaoAK ${key}` }

  // 1) 주소 검색
  const addrRes = await fetch(
    `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`,
    { headers }
  )
  const addr = await addrRes.json()
  if (addr.documents?.length) {
    const d = addr.documents[0]
    return { lng: Number(d.x), lat: Number(d.y) }
  }

  // 2) 주소로 안 나오면 키워드(장소명) 검색 (예: "전남대 정문")
  //    "광주역" 처럼 전국에 여러 개인 이름은 엉뚱한 도시가 잡히므로,
  //    광주광역시청(126.8526, 35.1601) 중심 반경 20km 내에서 가까운 순으로 검색.
  const GWANGJU = 'x=126.8526&y=35.1601&radius=20000&sort=distance'
  const kwRes = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&${GWANGJU}`,
    { headers }
  )
  const kw = await kwRes.json()
  if (kw.documents?.length) {
    const d = kw.documents[0]
    return { lng: Number(d.x), lat: Number(d.y) }
  }
  return null
}

// 두 좌표 사이 직선거리(km) — 카카오 길찾기 실패 시 대비책
function haversineKm(a: Coord, b: Coord): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

// 카카오모빌리티 길찾기(도로 경로 거리 m) — 직선보다 실제 이동에 가까움
async function routeKm(origin: Coord, dest: Coord): Promise<number | null> {
  const key = process.env.KAKAO_REST_API_KEY!
  try {
    const res = await fetch(
      `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin.lng},${origin.lat}&destination=${dest.lng},${dest.lat}`,
      { headers: { Authorization: `KakaoAK ${key}` } }
    )
    if (!res.ok) return null
    const json = await res.json()
    const meters = json.routes?.[0]?.summary?.distance
    return typeof meters === 'number' ? meters / 1000 : null
  } catch {
    return null
  }
}

export async function calcDistanceKm(
  startQuery: string,
  endQuery: string
): Promise<{ km: number; method: string } | { error: string }> {
  if (!process.env.KAKAO_REST_API_KEY) {
    return { error: '카카오 키가 설정되지 않았습니다. 직접 입력을 사용해주세요.' }
  }
  const start = await geocode(startQuery)
  if (!start) return { error: '시작 주소를 찾을 수 없습니다. 더 정확히 입력해보세요.' }
  const end = await geocode(endQuery)
  if (!end) return { error: '종료 주소를 찾을 수 없습니다. 더 정확히 입력해보세요.' }

  const route = await routeKm(start, end)
  if (route != null) return { km: Math.round(route * 100) / 100, method: '도로 경로' }

  const straight = haversineKm(start, end)
  return { km: Math.round(straight * 100) / 100, method: '직선 거리(근사)' }
}
