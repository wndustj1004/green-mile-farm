// 점검에 필요한 데이터를 한 번만 읽어와 공유하는 꾸러미 (읽기 전용)
import type { SupabaseClient } from '@supabase/supabase-js'

export type CertRow = {
  id: string
  user_id: string
  transport: string
  distance_km: number | string
  co2_reduced_g: number | string
  status: string
  processed_at: string | null
  created_at: string
  start_photo_1: string | null
  start_photo_2: string | null
  end_photo_1: string | null
  end_photo_2: string | null
  original_distance_km: number | string | null
  distance_edit_reason: string | null
  distance_edited_by: string | null
  distance_edited_at: string | null
}

export type ProfileRow = {
  id: string
  username: string | null
  name: string | null
  phone: string | null
  address: string | null
  email: string | null
}

export type SettingsRow = {
  id: number
  target_co2_kg: number | string
  challenge_start: string | null
  challenge_end: string | null
  car_emission: number | string
  walk_emission: number | string
  bike_emission: number | string
  bus_emission: number | string
  subway_emission: number | string
  updated_at: string
}

export type PhotoAudit = {
  db_paths: number
  storage_files: number
  missing_count: number
  missing_samples: string[]
  orphan_count: number
  orphan_bytes: number
  orphan_samples: string[]
}

export type DbStats = {
  db_bytes: number
  tables: { name: string; total_bytes: number; row_estimate: number }[]
}

export type StorageStat = { bucket: string; files: number; bytes: number }

export type ChallengeStats = {
  participants: number
  total_reduced_kg: number
  harvest_count: number
}

export type HealthContext = {
  sb: SupabaseClient
  settings: SettingsRow | null
  certs: CertRow[]
  profiles: ProfileRow[]
  landingImageUrls: string[]
  siteImageUrls: { key: string; url: string }[]
  photoAudit: PhotoAudit | null
  photoAuditError: string | null
  dbStats: DbStats | null
  dbStatsError: string | null
  storageStats: StorageStat[] | null
  storageStatsError: string | null
  challengeStats: ChallengeStats | null
  recentDurationsMs: number[]
  healthLogRows: number
}

/** 1000행씩 나눠서 전부 읽어옵니다. (PostgREST 기본 상한 회피) */
async function fetchAll<T>(
  sb: SupabaseClient,
  table: string,
  columns: string
): Promise<T[]> {
  const PAGE = 1000
  const out: T[] = []
  for (let page = 0; page < 50; page++) {
    const from = page * PAGE
    const { data, error } = await sb
      .from(table)
      .select(columns)
      .range(from, from + PAGE - 1)
    if (error) throw new Error(`${table} 조회 실패: ${error.message}`)
    const rows = (data ?? []) as unknown as T[]
    out.push(...rows)
    if (rows.length < PAGE) break
  }
  return out
}

/** 메인페이지 이미지 URL에서 landing-images 버킷 안 경로만 뽑아냅니다. */
export function extractLandingPath(url: string): string | null {
  if (!url) return null
  const m = url.match(/landing-images\/(.+?)(?:\?|$)/)
  if (!m) return null
  try {
    return decodeURIComponent(m[1])
  } catch {
    return m[1]
  }
}

export async function loadHealthContext(sb: SupabaseClient): Promise<HealthContext> {
  const { data: settings } = await sb.from('settings').select('*').eq('id', 1).maybeSingle()

  const certs = await fetchAll<CertRow>(
    sb,
    'certifications',
    'id,user_id,transport,distance_km,co2_reduced_g,status,processed_at,created_at,start_photo_1,start_photo_2,end_photo_1,end_photo_2,original_distance_km,distance_edit_reason,distance_edited_by,distance_edited_at'
  )
  const profiles = await fetchAll<ProfileRow>(sb, 'profiles', 'id,username,name,phone,address,email')

  // 메인페이지에 걸린 이미지 주소들
  const { data: sections } = await sb.from('landing_sections').select('images')
  const landingImageUrls = (sections ?? []).flatMap(
    (s: { images: string[] | null }) => s.images ?? []
  )
  const { data: texts } = await sb.from('site_texts').select('key,value')
  const siteImageUrls = (texts ?? [])
    .filter((t: { key: string; value: string }) => /^(guide\.img|realfarm\.photo)/.test(t.key))
    .filter((t: { key: string; value: string }) => !!t.value?.trim())
    .map((t: { key: string; value: string }) => ({ key: t.key, url: t.value }))

  // SQL 함수 3종 (11_health_logs.sql 실행 전이면 오류 메시지를 담아둠)
  const audit = await sb.rpc('health_photo_audit')
  const db = await sb.rpc('health_db_stats')
  const storage = await sb.rpc('health_storage_stats')
  const stats = await sb.rpc('challenge_stats')

  // 최근 점검 소요시간(추세 비교용) + 누적 기록 수
  const { data: logs } = await sb
    .from('health_logs')
    .select('duration_ms')
    .order('run_at', { ascending: false })
    .limit(5)
  const { count: logCount } = await sb
    .from('health_logs')
    .select('id', { count: 'exact', head: true })

  return {
    sb,
    settings: (settings as SettingsRow) ?? null,
    certs,
    profiles,
    landingImageUrls,
    siteImageUrls,
    photoAudit: audit.error ? null : (audit.data as PhotoAudit),
    photoAuditError: audit.error?.message ?? null,
    dbStats: db.error ? null : (db.data as DbStats),
    dbStatsError: db.error?.message ?? null,
    storageStats: storage.error ? null : (storage.data as StorageStat[]),
    storageStatsError: storage.error?.message ?? null,
    challengeStats: stats.error ? null : (stats.data as ChallengeStats),
    recentDurationsMs: (logs ?? []).map((l: { duration_ms: number }) => Number(l.duration_ms)),
    healthLogRows: logCount ?? 0,
  }
}
