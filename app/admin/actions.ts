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

// =============================================================
//  랜딩 소개 섹션 관리 (메인페이지 아래 스크롤 영역)
// =============================================================

export type LandingSection = {
  id: string
  sort_order: number
  emoji: string
  title: string
  body: string
  visible: boolean
  images: string[]
}

export type SectionEdit = {
  emoji: string
  title: string
  body: string
  visible: boolean
}

// 새 섹션 추가 (맨 아래에 빈 섹션 생성)
export async function createSection(): Promise<{ error: string } | { ok: true }> {
  if (!(await checkAdmin())) return { error: '권한이 없습니다.' }
  const supabase = createClient()
  const { data: maxRow } = await supabase
    .from('landing_sections')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const nextOrder = (maxRow?.sort_order ?? 0) + 1
  const { error } = await supabase
    .from('landing_sections')
    .insert({ sort_order: nextOrder, emoji: '🌿', title: '새 섹션', body: '', visible: true })
  if (error) return { error: '추가 실패: ' + error.message }
  revalidatePath('/admin/content')
  revalidatePath('/')
  return { ok: true }
}

// 섹션 내용 수정
export async function updateSection(
  id: string,
  input: SectionEdit
): Promise<{ error: string } | { ok: true }> {
  if (!(await checkAdmin())) return { error: '권한이 없습니다.' }
  if (!input.title.trim()) return { error: '제목을 입력해주세요.' }

  const supabase = createClient()
  const { error } = await supabase
    .from('landing_sections')
    .update({
      emoji: input.emoji.trim() || '🌿',
      title: input.title.trim(),
      body: input.body,
      visible: input.visible,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { error: '저장 실패: ' + error.message }
  revalidatePath('/admin/content')
  revalidatePath('/')
  return { ok: true }
}

// 섹션 이미지 목록 저장 (업로드는 클라이언트에서 Storage로, 여기선 경로 목록만 갱신)
export async function updateSectionImages(
  id: string,
  images: string[]
): Promise<{ error: string } | { ok: true }> {
  if (!(await checkAdmin())) return { error: '권한이 없습니다.' }
  const supabase = createClient()
  const { error } = await supabase.from('landing_sections').update({ images }).eq('id', id)
  if (error) return { error: '이미지 저장 실패: ' + error.message }
  revalidatePath('/admin/content')
  revalidatePath('/')
  return { ok: true }
}

// 섹션 삭제
export async function deleteSection(id: string): Promise<{ error: string } | { ok: true }> {
  if (!(await checkAdmin())) return { error: '권한이 없습니다.' }
  const supabase = createClient()
  const { error } = await supabase.from('landing_sections').delete().eq('id', id)
  if (error) return { error: '삭제 실패: ' + error.message }
  revalidatePath('/admin/content')
  revalidatePath('/')
  return { ok: true }
}

// 섹션 순서 이동(위/아래) — 인접 섹션과 sort_order 교환
export async function moveSection(
  id: string,
  dir: 'up' | 'down'
): Promise<{ error: string } | { ok: true }> {
  if (!(await checkAdmin())) return { error: '권한이 없습니다.' }
  const supabase = createClient()
  const { data: list } = await supabase
    .from('landing_sections')
    .select('id, sort_order')
    .order('sort_order', { ascending: true })
  if (!list) return { error: '목록을 불러오지 못했습니다.' }

  const idx = list.findIndex((s) => s.id === id)
  if (idx === -1) return { error: '섹션을 찾을 수 없습니다.' }
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= list.length) return { ok: true } // 이미 끝 — 변화 없음

  const a = list[idx]
  const b = list[swapIdx]
  await supabase.from('landing_sections').update({ sort_order: b.sort_order }).eq('id', a.id)
  await supabase.from('landing_sections').update({ sort_order: a.sort_order }).eq('id', b.id)

  revalidatePath('/admin/content')
  revalidatePath('/')
  return { ok: true }
}
