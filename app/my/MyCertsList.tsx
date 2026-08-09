'use client'

import { useState } from 'react'
import { TRANSPORTS, TRANSPORT_LABEL, type TransportKey } from '@/lib/transport'
import {
  formatAwardedAt,
  formatPeriod,
  kindInfo,
  sumSettledKg,
  type BonusAward,
} from '@/lib/bonus'

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

type Cat = 'all' | 'approved' | 'pending' | 'rejected' | 'bonus'
type CertCat = 'approved' | 'pending' | 'rejected'

function categoryOf(r: CertRow): CertCat {
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

export default function MyCertsList({
  rows,
  bonuses = [],
}: {
  rows: CertRow[]
  bonuses?: BonusAward[]
}) {
  const [cat, setCat] = useState<Cat>('all')

  const counts = {
    all: rows.length,
    approved: rows.filter((r) => categoryOf(r) === 'approved').length,
    pending: rows.filter((r) => categoryOf(r) === 'pending').length,
    rejected: rows.filter((r) => categoryOf(r) === 'rejected').length,
    bonus: bonuses.length,
  }
  const filtered = cat === 'all' || cat === 'bonus' ? rows : rows.filter((r) => categoryOf(r) === cat)

  const chips: { key: Cat; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'approved', label: '승인' },
    { key: 'pending', label: '대기' },
    { key: 'rejected', label: '반려' },
    { key: 'bonus', label: '보너스' },
  ]

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => setCat(c.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
              cat === c.key
                ? c.key === 'bonus'
                  ? 'bg-[#b45309] text-white'
                  : 'bg-gm-green text-white'
                : 'border border-gm-line bg-white text-gm-muted'
            }`}
          >
            {c.key === 'bonus' ? '🎁 ' : ''}
            {c.label} {counts[c.key]}
          </button>
        ))}
      </div>

      {cat === 'bonus' && <BonusPanel bonuses={bonuses} />}

      <div className={`mt-3.5 flex-col gap-2.5 ${cat === 'bonus' ? 'hidden' : 'flex'}`}>
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

/* ---------------- 보너스 적립 내역 ---------------- */
function BonusPanel({ bonuses }: { bonuses: BonusAward[] }) {
  const settled = bonuses.filter((b) => b.settled)
  const upcoming = bonuses.filter((b) => !b.settled)
  const totalKg = sumSettledKg(bonuses)

  // 화면에 나온 보너스 종류들의 설명(제도 안내)
  const notes = Array.from(new Set(bonuses.map((b) => b.kind))).map((k) => kindInfo(k))

  return (
    <div className="mt-3.5 flex flex-col gap-2.5">
      {/* 합계 */}
      <div className="rounded-2xl border border-[#f0e2c8] bg-[#fffaf0] px-4 py-3.5">
        <p className="text-xs text-[#a1793a]">보너스로 추가 적립된 감축량</p>
        <p className="mt-1 text-2xl font-bold text-[#b45309]">
          +{totalKg.toFixed(2)}
          <span className="text-sm"> kg CO₂</span>
        </p>
        <p className="mt-1 text-[11px] text-[#a1793a]">
          확정 {settled.length}건
          {upcoming.length > 0 && ` · 적립 예정 ${upcoming.length}건`} · 대시보드 누적 감축량에 이미
          포함되어 있어요.
        </p>
      </div>

      {bonuses.length === 0 && (
        <p className="rounded-2xl border border-gm-line bg-white px-4 py-6 text-center text-sm leading-relaxed text-gm-muted2">
          아직 받은 보너스가 없어요.
          <br />
          <span className="text-xs">
            한 주(월~일) 감축량 상위 3등 안에 들면 그 주 감축량의 50%를 더 받을 수 있어요!
          </span>
        </p>
      )}

      {/* 확정 적립 → 적립 예정 순 */}
      {[...settled, ...upcoming].map((b, i) => {
        const info = kindInfo(b.kind)
        return (
          <div
            key={`${b.kind}-${b.period_start}-${i}`}
            className={`rounded-2xl border bg-white p-4 ${
              b.settled ? 'border-[#f0e2c8]' : 'border-dashed border-gm-line'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-gm-ink2">
                  {info.icon} {b.title}
                </p>
                {/* 제도 이름과 건별 제목이 같으면(예: steady♡) 중복 표시하지 않음 */}
                {info.label !== b.title && (
                  <p className="mt-1 text-xs text-gm-muted2">{info.label}</p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                  b.settled ? 'bg-[#fdf3e0] text-[#b45309]' : 'bg-[#eeeee8] text-[#8a8d82]'
                }`}
              >
                {b.settled ? '적립 완료' : '적립 예정'}
              </span>
            </div>

            <p
              className={`mt-3 text-xl font-bold ${b.settled ? 'text-[#b45309]' : 'text-gm-muted2'}`}
            >
              +{(b.amount_g / 1000).toFixed(2)}
              <span className="text-xs"> kg CO₂</span>
            </p>

            <dl className="mt-2.5 space-y-1 text-xs text-gm-muted2">
              <Row label="대상 기간" value={formatPeriod(b.period_start, b.period_end)} />
              <Row label="산정 근거" value={b.detail} />
              <Row
                label={b.settled ? '적립 날짜' : '적립 예정일'}
                value={formatAwardedAt(b.awarded_at)}
              />
            </dl>

            {!b.settled && (
              <p className="mt-2.5 rounded-[10px] bg-gm-fill px-3 py-2.5 text-[11px] leading-relaxed text-gm-muted">
                이번 주는 아직 진행 중이라 순위가 바뀔 수 있어요. 주가 끝나면 확정되어 누적 감축량과
                작물 성장에 반영됩니다.
              </p>
            )}
          </div>
        )
      })}

      {/* 제도 설명 */}
      {notes.map((n) => (
        <p
          key={n.label}
          className="rounded-2xl border border-gm-line bg-white px-4 py-3 text-[11px] leading-relaxed text-gm-muted2"
        >
          <b className="text-gm-muted">{n.icon} {n.label}</b>
          <br />
          {n.note}
        </p>
      ))}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex gap-2">
      <dt className="w-16 shrink-0 text-gm-muted2">{label}</dt>
      <dd className="flex-1 text-gm-muted">{value}</dd>
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
