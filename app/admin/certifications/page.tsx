import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TRANSPORT_LABEL, type TransportKey } from '@/lib/transport'
import CertActions from './CertActions'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 15
type StatusFilter = 'all' | 'approved' | 'rejected'

export default async function AdminCertsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string }
}) {
  const supabase = createClient()

  const status: StatusFilter =
    searchParams.status === 'approved' || searchParams.status === 'rejected'
      ? searchParams.status
      : 'all'
  const page = Math.max(1, Number(searchParams.page) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  // 필요한 페이지(15건)만 조회 — 전체를 한 번에 불러오지 않음
  let query = supabase
    .from('certifications')
    .select('*, profiles(name, username)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (status !== 'all') query = query.eq('status', status)

  const { data: certs, count } = await query
  const rows = certs ?? []
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  // 사진(비공개) → 서명 URL. 목록은 200px 축소 썸네일(전송량 절감), 클릭 시 원본.
  const paths: string[] = []
  for (const c of rows) {
    for (const p of [c.start_photo_1, c.start_photo_2, c.end_photo_1, c.end_photo_2]) {
      if (p) paths.push(p)
    }
  }
  const thumbMap = new Map<string, string>()
  const fullMap = new Map<string, string>()
  if (paths.length) {
    await Promise.all(
      paths.map(async (p) => {
        const { data } = await supabase.storage
          .from('certification-photos')
          .createSignedUrl(p, 3600, { transform: { width: 200, height: 200, resize: 'cover', quality: 70 } })
        if (data?.signedUrl) thumbMap.set(p, data.signedUrl)
      })
    )
    const { data: signed } = await supabase.storage.from('certification-photos').createSignedUrls(paths, 3600)
    signed?.forEach((s) => {
      if (s.path && s.signedUrl) fullMap.set(s.path, s.signedUrl)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-gray-800">인증 내역 (총 {total}건)</h1>
        <div className="flex gap-1 text-xs">
          <FilterTab label="전체" value="all" active={status === 'all'} />
          <FilterTab label="승인됨" value="approved" active={status === 'approved'} />
          <FilterTab label="반려됨" value="rejected" active={status === 'rejected'} />
        </div>
      </div>

      {rows.length === 0 && <p className="text-sm text-gray-400">표시할 인증이 없습니다.</p>}

      {rows.map((c) => {
        const photos = [c.start_photo_1, c.start_photo_2, c.end_photo_1, c.end_photo_2]
        return (
          <div key={c.id} className="rounded-xl bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm">
                <b className="text-gray-800">{c.profiles?.name ?? '?'}</b>{' '}
                <span className="text-gray-400">@{c.profiles?.username ?? '?'}</span>
                <span className="ml-2 text-gray-500">
                  · {TRANSPORT_LABEL[c.transport as TransportKey]} {Number(c.distance_km)}km ·{' '}
                  {(Number(c.co2_reduced_g) / 1000).toFixed(2)}kg
                </span>
              </div>
              <StatusBadge status={c.status} />
            </div>

            <p className="mt-1 text-xs text-gray-400">
              {c.start_address || '시작'} → {c.end_address || '종료'} ·{' '}
              {new Date(c.created_at).toLocaleString('ko-KR')}
            </p>

            {/* 사진 (목록=축소 썸네일 / 클릭=원본) */}
            <div className="mt-3 flex flex-wrap gap-2">
              {photos.map((p, i) => {
                const thumb = p ? thumbMap.get(p) ?? fullMap.get(p) : undefined
                const full = p ? fullMap.get(p) ?? thumb : undefined
                return thumb ? (
                  <a key={i} href={full} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={thumb}
                      alt={`photo${i}`}
                      loading="lazy"
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  </a>
                ) : (
                  <div
                    key={i}
                    className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400"
                  >
                    없음
                  </div>
                )
              })}
            </div>

            {/* EXIF 요약 (촬영시각·GPS 유무) */}
            <p className="mt-2 text-xs text-gray-400">사진 메타데이터: {summarizeExif(c.exif_data)}</p>

            {/* 처리 정보 (처리 시각·반려 사유·거리 수정 이력) */}
            {c.processed_at && (
              <p className="mt-2 text-xs text-gray-400">
                처리 시각: {new Date(c.processed_at).toLocaleString('ko-KR')}
                {c.status === 'rejected' && c.reject_reason && (
                  <span className="mt-0.5 block text-red-500">반려 사유: {c.reject_reason}</span>
                )}
                {c.distance_edited_at && (
                  <span className="mt-0.5 block text-amber-600">
                    이동거리 수정: {Number(c.original_distance_km)}km → {Number(c.distance_km)}km
                    {c.distance_edit_reason ? ` · ${c.distance_edit_reason}` : ''} ·{' '}
                    {new Date(c.distance_edited_at).toLocaleString('ko-KR')}
                  </span>
                )}
              </p>
            )}

            {/* 승인(거리 수정 가능)/반려(사유 입력) 모달 */}
            <CertActions id={c.id} distanceKm={Number(c.distance_km)} />
          </div>
        )
      })}

      {/* 페이지 이동 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2 text-sm">
          <PageLink status={status} page={page - 1} disabled={page <= 1} label="‹ 이전" />
          <span className="text-gray-500">
            {page} / {totalPages}
          </span>
          <PageLink status={status} page={page + 1} disabled={page >= totalPages} label="다음 ›" />
        </div>
      )}
    </div>
  )
}

function FilterTab({ label, value, active }: { label: string; value: StatusFilter; active: boolean }) {
  return (
    <Link
      href={`?status=${value}`}
      className={`rounded-full px-3 py-1 font-medium ${
        active ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {label}
    </Link>
  )
}

function PageLink({
  status,
  page,
  disabled,
  label,
}: {
  status: StatusFilter
  page: number
  disabled: boolean
  label: string
}) {
  if (disabled) {
    return <span className="rounded-lg px-3 py-1.5 text-gray-300">{label}</span>
  }
  return (
    <Link
      href={`?status=${status}&page=${page}`}
      className="rounded-lg border border-gray-200 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
    >
      {label}
    </Link>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
  }
  const label: Record<string, string> = { approved: '승인됨', rejected: '반려됨' }
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? 'bg-gray-100 text-gray-500'}`}>
      {label[status] ?? status}
    </span>
  )
}

function summarizeExif(exif: unknown): string {
  if (!exif || typeof exif !== 'object') return '없음'
  const slots = Object.values(exif as Record<string, unknown>)
  let time = 0
  let gps = 0
  for (const s of slots) {
    if (s && typeof s === 'object') {
      const o = s as Record<string, unknown>
      if (o.DateTimeOriginal) time++
      if (o.latitude || o.GPSLatitude) gps++
    }
  }
  return `촬영시각 ${time}장 · GPS ${gps}장 기록됨`
}
