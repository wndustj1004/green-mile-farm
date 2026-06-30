'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
// 카카오 지도 SDK는 공식 타입이 없어 any로 접근합니다.

import { useEffect, useRef, useState } from 'react'

export type LatLng = { lat: number; lng: number }

// 카카오 지도 SDK는 런타임에 전역 window.kakao로 로드됨 (타입 선언 충돌을 피해 any로 접근)
const getKakao = (): any => (window as any).kakao

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY

// 거리 계산용 좌표 스냅: 약 30m 격자.
// 카카오는 캠퍼스 등 큰 부지에 '같은 도로명주소'를 주므로 주소로 합치면 건물 구분이 불가능.
// → 클릭한 실제 좌표를 ~30m 격자로만 정리: 같은 지점의 미세 손떨림은 흡수하고,
//    서로 다른 건물(30m+ 떨어짐)은 서로 다른 거리로 정확히 구분.
const SNAP_DEG = 0.0003
const snapCoord = (v: number) => Math.round(v / SNAP_DEG) * SNAP_DEG

export default function MapPicker({
  initialStart,
  initialEnd,
  onChange,
}: {
  initialStart?: LatLng | null
  initialEnd?: LatLng | null
  onChange: (which: 'start' | 'end', coord: LatLng, address: string) => void
}) {
  const boxRef = useRef<HTMLDivElement>(null)
  const map = useRef<any>(null)
  const geocoder = useRef<any>(null)
  const places = useRef<any>(null)
  const markers = useRef<{ start: any | null; end: any | null }>({ start: null, end: null })
  const labels = useRef<{ start: any | null; end: any | null }>({ start: null, end: null })
  const targetRef = useRef<'start' | 'end'>('start')

  const [target, setTarget] = useState<'start' | 'end'>(
    initialStart && !initialEnd ? 'end' : 'start'
  )
  const [ready, setReady] = useState(false)
  const [sdkError, setSdkError] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    targetRef.current = target
  }, [target])

  useEffect(() => {
    if (!KAKAO_KEY) {
      setSdkError('지도 키(NEXT_PUBLIC_KAKAO_MAP_KEY)가 아직 설정되지 않았습니다.')
      return
    }

    function init() {
      const kakao = getKakao()
      kakao.maps.load(() => {
        if (!boxRef.current || map.current) return
        const center = new kakao.maps.LatLng(35.1601, 126.8526) // 광주광역시청
        map.current = new kakao.maps.Map(boxRef.current, { center, level: 5 })
        geocoder.current = new kakao.maps.services.Geocoder()
        places.current = new kakao.maps.services.Places()

        // 지도 클릭 → 현재 선택된 대상(출발/도착)에 핀
        kakao.maps.event.addListener(map.current, 'click', (e: any) => {
          const ll = e.latLng
          placePin(targetRef.current, ll.getLat(), ll.getLng(), true)
        })

        // 기존 핀 복원(자동 채움 등): 마커만 조용히 표시(재계산·보고 안 함)
        if (initialStart) placePin('start', initialStart.lat, initialStart.lng, false, false)
        if (initialEnd) placePin('end', initialEnd.lat, initialEnd.lng, false, false)

        setReady(true)
      })
    }

    if (getKakao() && getKakao().maps) {
      init()
      return
    }
    const existing = document.getElementById('kakao-map-sdk') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', init)
      return
    }
    const script = document.createElement('script')
    script.id = 'kakao-map-sdk'
    script.async = true
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&libraries=services&autoload=false`
    script.onload = init
    script.onerror = () =>
      setSdkError('지도를 불러오지 못했습니다. 카카오 JavaScript 키와 도메인 등록을 확인해주세요.')
    document.head.appendChild(script)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function placePin(
    which: 'start' | 'end',
    lat: number,
    lng: number,
    advance: boolean,
    report = true
  ) {
    const kakao = getKakao()
    const pos = new kakao.maps.LatLng(lat, lng)

    let marker = markers.current[which]
    if (!marker) {
      marker = new kakao.maps.Marker({ position: pos, draggable: true, map: map.current })
      markers.current[which] = marker
      kakao.maps.event.addListener(marker, 'dragend', () => {
        const p = marker.getPosition()
        setLabel(which, p.getLat(), p.getLng())
        normalizeAndReport(which, p.getLat(), p.getLng())
      })
    } else {
      marker.setPosition(pos)
    }

    setLabel(which, lat, lng)
    if (report) normalizeAndReport(which, lat, lng)

    // 출발을 처음 찍으면 자동으로 '도착' 선택으로 넘어가 편하게
    if (advance && which === 'start' && !markers.current.end) setTarget('end')
  }

  function setLabel(which: 'start' | 'end', lat: number, lng: number) {
    const kakao = getKakao()
    const pos = new kakao.maps.LatLng(lat, lng)
    const color = which === 'start' ? '#16a34a' : '#dc2626'
    const text = which === 'start' ? '출발' : '도착'
    let label = labels.current[which]
    if (!label) {
      label = new kakao.maps.CustomOverlay({
        position: pos,
        yAnchor: 2.3,
        content: `<div style="padding:2px 7px;border-radius:9px;background:${color};color:#fff;font-size:11px;font-weight:700;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,.3)">${text}</div>`,
      })
      label.setMap(map.current)
      labels.current[which] = label
    } else {
      label.setPosition(pos)
    }
  }

  // 거리 계산용 좌표 보고. 마커는 클릭/드래그한 위치에 그대로 둠(점프 방지).
  // 클릭 좌표를 ~30m 격자로 스냅한 값을 거리 계산에 사용 → 같은 지점은 같은 거리,
  // 서로 다른 건물은 다른 거리(캠퍼스처럼 한 주소 여러 건물도 건물 단위로 산정).
  // 주소 텍스트는 화면 표시·기록용 라벨로만 역지오코딩(거리 계산엔 사용 안 함).
  function normalizeAndReport(which: 'start' | 'end', rawLat: number, rawLng: number) {
    const kakao = getKakao()
    const coord = { lat: snapCoord(rawLat), lng: snapCoord(rawLng) }
    // 인자 순서 주의: coord2Address(경도 lng, 위도 lat)
    geocoder.current.coord2Address(rawLng, rawLat, (result: any, status: any) => {
      let addr = ''
      if (status === kakao.maps.services.Status.OK && result[0]) {
        addr = result[0].road_address?.address_name || result[0].address?.address_name || ''
      }
      onChange(which, coord, addr)
    })
  }

  // 장소·주소 검색 (광주 중심으로 우선)
  function handleSearch() {
    const kakao = getKakao()
    const q = query.trim()
    if (!q || !places.current) return
    setSearching(true)
    places.current.keywordSearch(
      q,
      (data: any[], status: any) => {
        setSearching(false)
        setResults(status === kakao.maps.services.Status.OK ? data.slice(0, 6) : [])
      },
      {
        location: new kakao.maps.LatLng(35.1601, 126.8526),
        radius: 20000,
        sort: kakao.maps.services.SortBy.DISTANCE,
      }
    )
  }

  // 검색 결과 선택 → 현재 대상(출발/도착)에 핀을 찍고 지도 이동
  function pickResult(doc: any) {
    const kakao = getKakao()
    const lat = Number(doc.y)
    const lng = Number(doc.x)
    map.current.setCenter(new kakao.maps.LatLng(lat, lng))
    placePin(targetRef.current, lat, lng, true)
    setResults([])
    setQuery(doc.place_name || '')
  }

  return (
    <div>
      {/* 장소·주소 검색창 */}
      <div className="relative mb-2">
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSearch()
              }
            }}
            placeholder="장소·주소 검색 (예: 전남대 정문)"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !ready}
            className="shrink-0 rounded-lg bg-green-600 px-3 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {searching ? '검색…' : '검색'}
          </button>
        </div>
        {results.length > 0 && (
          <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pickResult(r)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-green-50"
                >
                  <span className="font-medium text-gray-800">{r.place_name}</span>
                  <span className="block text-xs text-gray-400">{r.road_address_name || r.address_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-1 text-xs text-gray-400">
          검색 결과를 누르면 <b>{target === 'start' ? '🟢 출발' : '🔴 도착'}</b> 위치에 핀이 찍혀요.
        </p>
      </div>

      {/* 출발/도착 선택 토글 */}
      <div className="mb-2 grid grid-cols-2 gap-2">
        {(['start', 'end'] as const).map((w) => (
          <button
            type="button"
            key={w}
            onClick={() => setTarget(w)}
            className={`rounded-lg border py-2 text-sm font-medium ${
              target === w
                ? w === 'start'
                  ? 'border-green-600 bg-green-50 text-green-700'
                  : 'border-red-500 bg-red-50 text-red-600'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            {w === 'start' ? '🟢 출발 위치' : '🔴 도착 위치'} 찍기
          </button>
        ))}
      </div>

      {/* 지도 */}
      <div
        ref={boxRef}
        className="h-64 w-full rounded-lg border border-gray-200 bg-gray-100"
        style={{ touchAction: 'none' }}
      />

      {sdkError ? (
        <p className="mt-1 text-xs text-red-500">{sdkError}</p>
      ) : (
        <p className="mt-1 text-xs text-gray-400">
          {ready ? '지도를 눌러 핀을 찍으세요. 마커를 드래그해 미세조정할 수 있어요.' : '지도를 불러오는 중...'}
        </p>
      )}
    </div>
  )
}
