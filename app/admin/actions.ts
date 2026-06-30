'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

// 현재 로그인 사용자가 관리자인지 확인
export async function checkAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  return data?.is_admin === true
}

// 인증 승인/반려 — 처리 시각·반려 사유 기록
export async function reviewCert(
  id: string,
  status: 'approved' | 'rejected',
  reason?: string
): Promise<{ error: string } | { ok: true }> {
  if (!(await checkAdmin())) return { error: '권한이 없습니다.' }
  if (!id || !['approved', 'rejected'].includes(status)) return { error: '잘못된 요청입니다.' }
  if (status === 'rejected' && !reason?.trim()) return { error: '반려 사유를 입력해주세요.' }

  const supabase = createClient()
  const { error } = await supabase
    .from('certifications')
    .update({
      status,
      processed_at: new Date().toISOString(),
      reject_reason: status === 'rejected' ? reason!.trim() : null,
    })
    .eq('id', id)

  if (error) return { error: '처리 실패: ' + error.message }
  revalidatePath('/admin/certifications')
  revalidatePath('/admin')
  return { ok: true }
}

export type SettingsInput = {
  targetCo2Kg: number
  challengeStart: string
  challengeEnd: string
  carEmission: number
  walkEmission: number
  bikeEmission: number
  busEmission: number
  subwayEmission: number
}

// 설정(목표·일정·배출계수) 저장
export async function updateSettings(
  input: SettingsInput
): Promise<{ error: string } | { ok: true }> {
  if (!(await checkAdmin())) return { error: '권한이 없습니다.' }
  if (!input.targetCo2Kg || input.targetCo2Kg <= 0) return { error: '목표 감축량은 0보다 커야 합니다.' }

  const supabase = createClient()
  const { error } = await supabase
    .from('settings')
    .update({
      target_co2_kg: input.targetCo2Kg,
      challenge_start: input.challengeStart || null,
      challenge_end: input.challengeEnd || null,
      car_emission: input.carEmission,
      walk_emission: input.walkEmission,
      bike_emission: input.bikeEmission,
      bus_emission: input.busEmission,
      subway_emission: input.subwayEmission,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

  if (error) return { error: '저장 실패: ' + error.message }
  revalidatePath('/admin/settings')
  revalidatePath('/dashboard')
  return { ok: true }
}
