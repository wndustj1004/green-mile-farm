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

// 직선거리 → 실제 이동경로 근사 보정계수. 방향과 무관하게 항상 동일.
// (일방통행·회전제한을 반영하는 자동차 길찾기 API는 A→B와 B→A가 달라 부적합 → 사용 안 함)
export const WALK_ROUTE_FACTOR = 1.3

// 두 좌표 사이 직선거리(km) — 하버사인 공식 (방향 무관·대칭)
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

  const km = haversineKm(start, end) * WALK_ROUTE_FACTOR
  return { km: Math.round(km * 100) / 100, method: '직선거리(보정 계수 적용)' }
}

// 지도 핀(건물 단위로 정규화된) 좌표로 거리 계산.
// 방향 무관: 하버사인 직선거리 × 보정계수. A→B와 B→A, 같은 건물 내 지점은 항상 동일.
export async function calcDistanceByCoords(
  start: { lat: number; lng: number },
  end: { lat: number; lng: number }
): Promise<{ km: number; method: string } | { error: string }> {
  const o = { lng: start.lng, lat: start.lat }
  const d = { lng: end.lng, lat: end.lat }
  const km = haversineKm(o, d) * WALK_ROUTE_FACTOR
  return { km: Math.round(km * 100) / 100, method: '직선거리(보정 계수 적용)' }
}
