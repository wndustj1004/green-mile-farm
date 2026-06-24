// 교통수단 4종 정보 (확정: 걷기·자전거·버스·지하철)
export type TransportKey = 'walk' | 'bike' | 'bus' | 'subway'

export const TRANSPORTS: { key: TransportKey; label: string; icon: string }[] = [
  { key: 'walk', label: '걷기', icon: '🚶' },
  { key: 'bike', label: '자전거', icon: '🚲' },
  { key: 'bus', label: '버스', icon: '🚌' },
  { key: 'subway', label: '지하철', icon: '🚇' },
]

export const TRANSPORT_LABEL: Record<TransportKey, string> = {
  walk: '걷기',
  bike: '자전거',
  bus: '버스',
  subway: '지하철',
}

// settings 테이블에서 각 수단의 배출계수 컬럼 이름
export const EMISSION_COLUMN: Record<TransportKey, string> = {
  walk: 'walk_emission',
  bike: 'bike_emission',
  bus: 'bus_emission',
  subway: 'subway_emission',
}
