'use client'

import { useState } from 'react'
import { TRANSPORTS, TRANSPORT_LABEL, type TransportKey } from '@/lib/transport'

export type CertRow = {
  id: string
  transport: string
  distanceKm: number
  co2Kg: number
  status: string
  processed: boolean
  rejectReason: string | null
  startAddress: string
  endAddress: string
  createdAt: string
  processedAt: string | null
  photos: (string | null)[]
}

type Cat = 'all' | 'approved' | 'pending' | 'rejected'

function categoryOf(r: CertRow): Exclude<Cat, 'all'> {
  if (r.status === 'rejected') return 'rejected'
  if (r.status === 'approved' && r.processed) return 'approved'
  return 'pending'
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MyCertsList({ rows }: { rows: CertRow[] }) {
  const [cat, setCat] = useState<Cat>('all')

  const counts = {
    all: rows.length,
    approved: rows.filter((r) => categoryOf(r) === 'approved').length,
    pending: rows.filter((r) => categoryOf(r) === 'pending').length,
    rejected: rows.filter((r) => categoryOf(r) === 'rejected').length,
  }
  const filtered = cat === 'all' ? rows : rows.filter((r) => categoryOf(r) === cat)

  const chips: { key: Cat; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'approved', label: '승인' },
    { key: 'pending', label: '대기' },
    { key: 'rejected', label: '반려' },
  ]

  return (
    <div className="mt-4">
      <div className="flex gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              cat === c.key
                ? 'bg-gm-green text-white'
                : 'border border-gm-line bg-white text-gm-muted'
            }`}
          >
            {c.label} {counts[c.key]}
          </button>
        ))}
      </div>

      <div className="mt-3.5 flex flex-col gap-2.5">
        {filtered.length === 0 && (
          <p className="rounded-2xl border border-gm-line bg-white px-4 py-6 text-center text-sm text-gm-muted2">
            해당하는 인증이 없습니다.
          </p>
        )}

        {filtered.map((c) => {
          const k = categoryOf(c)
          const icon = TRANSPORTS.find((t) => t.key === c.transport)?.icon ?? '🚶'
          return (
            <div
              key={c.id}
              className={`rounded-2xl border bg-white p-4 ${
                k === 'rejected' ? 'border-[#f0dada]' : 'border-gm-line'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-gm-ink2">
                  {icon} {TRANSPORT_LABEL[c.transport as TransportKey]} · {c.distanceKm}km · {c.co2Kg.toFixed(2)}kg CO₂
                </span>
                <Badge cat={k} />
              </div>

              <p className="mt-1.5 text-xs text-gm-muted2">
                {c.startAddress} → {c.endAddress}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.photos.map((url, i) =>
                  url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`사진 ${i + 1}`} className="h-[62px] w-[62px] rounded-[10px] object-cover" />
                    </a>
                  ) : (
                    <div
                      key={i}
                      className="flex h-[62px] w-[62px] items-center justify-center rounded-[10px] bg-gm-fill text-[11px] text-gm-muted2"
                    >
                      없음
                    </div>
                  )
                )}
              </div>

              {k === 'rejected' && c.rejectReason && (
                <div className="mt-2.5 rounded-[10px] bg-[#fdf2f2] px-3 py-2.5 text-xs leading-relaxed text-[#c0392b]">
                  반려 사유: {c.rejectReason}
                </div>
              )}

              <p className="mt-2.5 text-[11px] text-gm-muted2">
                업로드 {fmt(c.createdAt)}
                {c.processedAt ? ` · 처리 ${fmt(c.processedAt)}` : k === 'pending' ? ' · 운영진 확인 전' : ''}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Badge({ cat }: { cat: 'approved' | 'pending' | 'rejected' }) {
  const map = {
    approved: { label: '승인', cls: 'bg-[#dcfce7] text-[#15803d]' },
    pending: { label: '대기', cls: 'bg-[#eeeee8] text-[#8a8d82]' },
    rejected: { label: '반려', cls: 'bg-[#fde8e8] text-[#c0392b]' },
  }[cat]
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${map.cls}`}>{map.label}</span>
}
