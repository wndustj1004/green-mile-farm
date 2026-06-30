'use server'

import { createClient } from '@/lib/supabase/server'
import { calcDistanceKm, calcDistanceByCoords } from '@/lib/kakao'
import { EMISSION_COLUMN, TRANSPORT_LABEL, type TransportKey } from '@/lib/transport'

type LatLng = { lat: number; lng: number }

// 주소 텍스트 → 카카오 거리 자동 계산 (구버전, 직접입력 보조용으로 유지)
export async function calcDistanceAction(startQuery: string, endQuery: string) {
  if (!startQuery?.trim() || !endQuery?.trim()) {
    return { error: '시작/종료 주소를 모두 입력해주세요.' }
  }
  return await calcDistanceKm(startQuery, endQuery)
}

// 지도 핀 좌표 → 카카오 거리 자동 계산 (현재 폼이 사용)
export async function calcDistanceByCoordsAction(
  start: LatLng | null,
  end: LatLng | null
) {
  if (!start || !end) return { error: '출발·도착 핀을 모두 찍어주세요.' }
  return await calcDistanceByCoords(start, end)
}

export type CertifyInput = {
  transport: TransportKey
  distanceKm: number
  startAddress: string
  endAddress: string
  photos: { start1?: string; start2?: string; end1?: string; end2?: string }
  exif?: unknown
}

export type CertifyResult = {
  name: string
  transportLabel: string
  distanceKm: number
  co2Kg: number
  startAddress: string
  endAddress: string
}

export async function submitCertification(
  input: CertifyInput
): Promise<{ error: string } | { ok: true; result: CertifyResult }> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  if (!(input.transport in EMISSION_COLUMN)) {
    return { error: '교통수단을 선택해주세요.' }
  }
  const dist = Number(input.distanceKm)
  if (!dist || dist <= 0) return { error: '이동 거리를 0보다 큰 숫자로 입력해주세요.' }
  if (dist > 200) return { error: '이동 거리가 너무 큽니다(200km 초과). 다시 확인해주세요.' }

  // 배출계수는 서버에서 직접 읽어 계산 (사용자가 조작할 수 없게)
  const { data: settings } = await supabase.from('settings').select('*').eq('id', 1).single()
  if (!settings) return { error: '설정값을 불러오지 못했습니다.' }

  const car = Number(settings.car_emission)
  const mode = Number(settings[EMISSION_COLUMN[input.transport]])
  // 감축량(g) = (승용차 배출 - 선택 수단 배출) × 거리
  const reducedG = Math.max(0, Math.round((car - mode) * dist * 100) / 100)

  const { error } = await supabase.from('certifications').insert({
    user_id: user.id,
    transport: input.transport,
    start_address: input.startAddress?.trim() || null,
    end_address: input.endAddress?.trim() || null,
    distance_km: dist,
    co2_reduced_g: reducedG,
    start_photo_1: input.photos.start1 ?? null,
    start_photo_2: input.photos.start2 ?? null,
    end_photo_1: input.photos.end1 ?? null,
    end_photo_2: input.photos.end2 ?? null,
    exif_data: input.exif ?? null,
    status: 'approved',
  })
  if (error) return { error: '등록에 실패했습니다: ' + error.message }

  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single()

  return {
    ok: true,
    result: {
      name: profile?.name ?? '회원',
      transportLabel: TRANSPORT_LABEL[input.transport],
      distanceKm: dist,
      co2Kg: reducedG / 1000,
      startAddress: input.startAddress?.trim() || '시작 지점',
      endAddress: input.endAddress?.trim() || '종료 지점',
    },
  }
}
