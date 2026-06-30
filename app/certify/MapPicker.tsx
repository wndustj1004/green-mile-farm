'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */
// 카카오 지도 SDK는 공식 타입이 없어 any로 접근합니다.

import { useEffect, useRef, useState } from 'react'

export type LatLng = { lat: number; lng: number }

// 카카오 지도 SDK는 런타임에 전역 window.kakao로 로드됨 (타입 선언 충돌을 피해 any로 접근)
const getKakao = (): any => (window as any).kakao

const KAKAO_KEY = process.env.NEXT_PUBLIC_KAKAO_MAP_KEY

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
  const markers = useRef<{ start: any | null; end: any | null }>({ start: null, end: null })
  const labels = useRef<{ start: any | null; end: any | null }>({ start: null, end: null })
  const targetRef = useRef<'start' | 'end'>('start')

  const [target, setTarget] = useState<'start' | 'end'>('start')
  const [ready, setReady] = useState(false)
  const [sdkError, setSdkError] = useState('')

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

        // 지도 클릭 → 현재 선택된 대상(출발/도착)에 핀
        kakao.maps.event.addListener(map.current, 'click', (e: any) => {
          const ll = e.latLng
          placePin(targetRef.current, ll.getLat(), ll.getLng(), true)
        })

        // 다른 입력방식에서 돌아왔을 때 기존 핀 복원
        if (initialStart) placePin('start', initialStart.lat, initialStart.lng, false)
        if (initialEnd) placePin('end', initialEnd.lat, initialEnd.lng, false)

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

  function placePin(which: 'start' | 'end', lat: number, lng: number, advance: boolean) {
    const kakao = getKakao()
    const pos = new kakao.maps.LatLng(lat, lng)

    let marker = markers.current[which]
    if (!marker) {
      marker = new kakao.maps.Marker({ position: pos, draggable: true, map: map.current })
      markers.current[which] = marker
      kakao.maps.event.addListener(marker, 'dragend', () => {
        const p = marker.getPosition()
        setLabel(which, p.getLat(), p.getLng())
        reverseAndReport(which, p.getLat(), p.getLng())
      })
    } else {
      marker.setPosition(pos)
    }

    setLabel(which, lat, lng)
    reverseAndReport(which, lat, lng)

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

  function reverseAndReport(which: 'start' | 'end', lat: number, lng: number) {
    const kakao = getKakao()
    // 주의: coord2Address 인자 순서는 (경도 lng, 위도 lat)
    geocoder.current.coord2Address(lng, lat, (result: any, status: any) => {
      let addr = ''
      if (status === kakao.maps.services.Status.OK && result[0]) {
        addr = result[0].road_address?.address_name || result[0].address?.address_name || ''
      }
      onChange(which, { lat, lng }, addr)
    })
  }

  return (
    <div>
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
