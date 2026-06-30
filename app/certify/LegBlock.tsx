'use client'

import { useState } from 'react'
import { calcDistanceByCoordsAction } from './actions'
import { TRANSPORTS, type TransportKey } from '@/lib/transport'
import MapPicker, { type LatLng } from './MapPicker'

export const PHOTO_SLOTS = [
  { key: 'start1', label: '시작 · 현장 촬영' },
  { key: 'start2', label: '시작 · 지도 스크린샷' },
  { key: 'end1', label: '종료 · 현장 촬영' },
  { key: 'end2', label: '종료 · 지도 스크린샷' },
] as const

// 한 동선(leg): 교통수단 + 출발/도착(핀 좌표·주소) + 사진 4장 + 거리
export type Leg = {
  transport: TransportKey | ''
  mode: 'auto' | 'manual'
  distance: string
  startAddress: string
  endAddress: string
  startCoord: LatLng | null
  endCoord: LatLng | null
  files: Record<string, File | null>
  previews: Record<string, string>
  calcInfo: string
}

export const emptyLeg = (init?: Partial<Leg>): Leg => ({
  transport: '',
  mode: 'auto',
  distance: '',
  startAddress: '',
  endAddress: '',
  startCoord: null,
  endCoord: null,
  files: {},
  previews: {},
  calcInfo: '',
  ...init,
})

function StepHeader({ n, title, hint }: { n: number; title: string; hint?: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gm-fill text-[11px] font-bold text-gm-green">
        {n}
      </span>
      <span className="text-sm font-bold text-gm-ink2">{title}</span>
      {hint && <span className="text-xs font-semibold text-gm-muted2">{hint}</span>}
    </div>
  )
}

export default function LegBlock({
  leg,
  index,
  total,
  update,
  setError,
}: {
  leg: Leg
  index: number
  total: number
  update: (partial: Partial<Leg>) => void
  setError: (msg: string) => void
}) {
  const [calcLoading, setCalcLoading] = useState(false)
  const bothPins = !!leg.startCoord && !!leg.endCoord

  function setFile(slot: string, file: File | null) {
    setError('')
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 첨부할 수 있습니다.')
        return
      }
      if (file.size > 8 * 1024 * 1024) {
        setError('사진 용량은 8MB 이하여야 합니다.')
        return
      }
    }
    const previews = { ...leg.previews }
    if (previews[slot]) URL.revokeObjectURL(previews[slot])
    if (file) previews[slot] = URL.createObjectURL(file)
    else delete previews[slot]
    update({ files: { ...leg.files, [slot]: file }, previews })
  }

  async function handleCalc() {
    setError('')
    if (!leg.startCoord || !leg.endCoord) {
      setError('출발·도착 핀을 모두 찍어주세요.')
      return
    }
    setCalcLoading(true)
    const res = await calcDistanceByCoordsAction(leg.startCoord, leg.endCoord)
    setCalcLoading(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    update({ distance: String(res.km), calcInfo: `${res.method} 기준 ${res.km}km 계산됨` })
  }

  const inputCls =
    'w-full rounded-lg border border-gm-line px-3 py-2.5 text-sm focus:border-gm-leaf focus:outline-none focus:ring-1 focus:ring-gm-leaf'

  return (
    <div className="rounded-[20px] border border-gm-line bg-white p-5">
      <span className="inline-block rounded-full bg-gm-green px-3 py-1 text-xs font-bold text-white">
        동선 {index + 1}
        {total > 1 ? ` / ${total}` : ''}
      </span>

      <div className="mt-[18px] space-y-5">
        {/* 1) 교통수단 */}
        <div>
          <StepHeader n={1} title="교통수단" />
          <div className="grid grid-cols-4 gap-2">
            {TRANSPORTS.map((t) => (
              <button
                type="button"
                key={t.key}
                onClick={() => update({ transport: t.key })}
                className={`rounded-xl border py-3 text-center text-xs ${
                  leg.transport === t.key
                    ? 'border-[1.5px] border-gm-green bg-gm-sage font-bold text-gm-green'
                    : 'border-gm-line text-gm-muted'
                }`}
              >
                <div className="text-xl">{t.icon}</div>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2) 이동 거리 */}
        <div>
          <StepHeader n={2} title="이동 거리" />
          <div className="mb-3 grid grid-cols-2 gap-2">
            {(['auto', 'manual'] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => update({ mode: m, calcInfo: '' })}
                className={`rounded-lg border py-2.5 text-sm ${
                  leg.mode === m
                    ? 'border-[1.5px] border-gm-green bg-gm-sage font-bold text-gm-green'
                    : 'border-gm-line text-gm-muted'
                }`}
              >
                {m === 'auto' ? '지도에서 핀 찍기' : '직접 입력'}
              </button>
            ))}
          </div>

          {leg.mode === 'auto' ? (
            <div>
              <MapPicker
                initialStart={leg.startCoord}
                initialEnd={leg.endCoord}
                onChange={(which, coord, address) => {
                  if (which === 'start')
                    update({ startCoord: coord, startAddress: address, distance: '', calcInfo: '' })
                  else update({ endCoord: coord, endAddress: address, distance: '', calcInfo: '' })
                }}
              />

              <div className="mt-2 space-y-1 text-xs">
                <p className="text-gm-muted">
                  🟢 출발: {leg.startAddress || <span className="text-gm-muted2">지도에서 핀을 찍어주세요</span>}
                </p>
                <p className="text-gm-muted">
                  🔴 도착: {leg.endAddress || <span className="text-gm-muted2">지도에서 핀을 찍어주세요</span>}
                </p>
              </div>

              <button
                type="button"
                onClick={handleCalc}
                disabled={!bothPins || calcLoading}
                className="mt-3 w-full rounded-lg border-[1.5px] border-[#bcd0a8] py-2.5 text-sm font-bold text-gm-green hover:bg-gm-sage disabled:cursor-not-allowed disabled:border-gm-line disabled:text-gm-muted2"
              >
                {calcLoading ? '계산 중...' : '📍 거리 자동 계산'}
              </button>
              {!bothPins && (
                <p className="mt-1 text-center text-xs text-gm-muted2">출발·도착 핀을 모두 찍으면 계산할 수 있어요.</p>
              )}
              {leg.distance && (
                <p className="mt-2 text-center text-sm font-bold text-gm-ink2">이동 거리: {leg.distance} km</p>
              )}
              {leg.calcInfo && <p className="mt-1 text-center text-xs text-gm-muted2">{leg.calcInfo}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <input className={inputCls} value={leg.startAddress} onChange={(e) => update({ startAddress: e.target.value })} placeholder="시작 위치 (예: 전남대 정문)" />
              <input className={inputCls} value={leg.endAddress} onChange={(e) => update({ endAddress: e.target.value })} placeholder="종료 위치 (예: 광주역)" />
              <input type="number" step="0.1" min="0" className={inputCls} value={leg.distance} onChange={(e) => update({ distance: e.target.value })} placeholder="이동 거리 km (예: 2.5)" />
            </div>
          )}
        </div>

        {/* 3) 사진 */}
        <div>
          <StepHeader n={3} title="사진" hint="(시작·종료 각 2장)" />
          <p className="mb-2.5 ml-7 text-[11.5px] leading-snug text-gm-muted2">
            위치마다 ① 현장 직접 촬영 ② 지도 앱 현재위치 스크린샷 1장씩.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {PHOTO_SLOTS.map((slot) => (
              <label
                key={slot.key}
                className="relative flex h-[82px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-[1.5px] border-dashed border-[#cfd3c6] text-center text-xs text-gm-muted2 hover:bg-gm-sage"
              >
                {leg.previews[slot.key] ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={leg.previews[slot.key]} alt={slot.label} className="absolute inset-0 h-full w-full object-cover" />
                    <span className="absolute bottom-0 w-full bg-black/50 py-0.5 text-[10px] text-white">{slot.label}</span>
                  </>
                ) : (
                  <span className="px-2">＋ {slot.label}</span>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(slot.key, e.target.files?.[0] ?? null)} />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
