'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import exifr from 'exifr'
import { createClient } from '@/lib/supabase/client'
import { type TransportKey } from '@/lib/transport'
import { submitCertification, type CertifyResult } from './actions'
import LegBlock, { type Leg, emptyLeg, PHOTO_SLOTS } from './LegBlock'

const MAX_LEGS = 5

export default function CertifyForm({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()

  const [legs, setLegs] = useState<Leg[]>([emptyLeg()])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CertifyResult[] | null>(null)
  const [modalIndex, setModalIndex] = useState(0)

  function isLegComplete(leg: Leg) {
    return (
      !!leg.transport &&
      !!leg.startCoord &&
      !!leg.endCoord &&
      parseFloat(leg.distance) > 0 &&
      PHOTO_SLOTS.every((s) => leg.files[s.key])
    )
  }
  const allComplete = legs.every(isLegComplete)

  function updateLeg(i: number, partial: Partial<Leg>) {
    setLegs((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...partial } : l)))
  }

  // 추가 동선: 새 동선의 출발 = 직전 동선의 도착(경유지 연속성)
  function addLeg() {
    if (!allComplete || legs.length >= MAX_LEGS) return
    const last = legs[legs.length - 1]
    setLegs((prev) => [
      ...prev,
      emptyLeg({ startCoord: last.endCoord, startAddress: last.endAddress }),
    ])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!allComplete) {
      setError('모든 동선의 교통수단·출발/도착 핀·사진 4장을 완성해주세요.')
      return
    }

    setLoading(true)
    try {
      const out: CertifyResult[] = []
      // 동선마다 개별 인증 기록으로 저장 (각각 CO₂ 계산·적립)
      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i]
        const photos: Record<string, string> = {}
        const exif: Record<string, unknown> = {}
        for (const slot of PHOTO_SLOTS) {
          const file = leg.files[slot.key]
          if (!file) continue
          try {
            exif[slot.key] = await exifr.parse(file, ['DateTimeOriginal', 'GPSLatitude', 'GPSLongitude'])
          } catch {
            exif[slot.key] = null
          }
          const ext = file.name.split('.').pop() || 'jpg'
          const path = `${userId}/${Date.now()}_leg${i}_${slot.key}.${ext}`
          const { error: upErr } = await supabase.storage.from('certification-photos').upload(path, file)
          if (upErr) throw new Error('사진 업로드 실패: ' + upErr.message)
          photos[slot.key] = path
        }

        const res = await submitCertification({
          transport: leg.transport as TransportKey,
          distanceKm: parseFloat(leg.distance),
          startAddress: leg.startAddress,
          endAddress: leg.endAddress,
          photos,
          exif,
        })
        if ('error' in res) throw new Error(res.error)
        out.push(res.result)
      }

      setResults(out)
      setModalIndex(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
      setLoading(false)
    }
  }

  function nextModal() {
    if (!results) return
    if (modalIndex < results.length - 1) setModalIndex(modalIndex + 1)
    else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <main className="min-h-screen bg-green-50 px-4 py-8">
      <div className="mx-auto max-w-md">
        <div className="mb-4">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-600">
            ← 대시보드
          </Link>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-xl font-bold text-green-700">이동 인증하기 🚶</h1>
          <p className="mb-5 text-sm text-gray-500">
            교통수단을 갈아탔다면 <b>동선을 추가</b>해 구간별로 인증하세요!
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {legs.map((leg, i) => (
              <LegBlock
                key={i}
                leg={leg}
                index={i}
                total={legs.length}
                update={(partial) => updateLeg(i, partial)}
                setError={setError}
              />
            ))}

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            {!allComplete && (
              <p className="text-center text-xs text-gray-400">
                모든 동선의 교통수단·핀·사진을 완성하면 등록·추가가 가능해요.
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !allComplete}
              className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? '등록 중...' : `등록하기 (동선 ${legs.length}개)`}
            </button>

            <button
              type="button"
              onClick={addLeg}
              disabled={!allComplete || legs.length >= MAX_LEGS}
              className="w-full rounded-lg border border-green-600 py-3 font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-300"
            >
              {legs.length >= MAX_LEGS ? '동선은 최대 5개까지예요' : '+ 추가 동선 입력하기'}
            </button>
          </form>
        </div>
      </div>

      {/* 결과 모달 (동선 개수만큼 순차 표시) */}
      {results && results[modalIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="text-5xl">🌱</div>
            <h2 className="mt-3 text-lg font-bold text-green-700">
              인증 완료! {results.length > 1 && <span className="text-sm text-gray-400">(동선 {modalIndex + 1})</span>}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              <b>{results[modalIndex].name}</b>님이 <b>{results[modalIndex].startAddress}</b>에서{' '}
              <b>{results[modalIndex].endAddress}</b>까지 <b>{results[modalIndex].transportLabel}</b>으로{' '}
              <b>{results[modalIndex].distanceKm}km</b>를 이동하면서 감축된 CO₂량은 차량 이용 대비{' '}
              <b className="text-green-700">{results[modalIndex].co2Kg.toFixed(2)} kgCO₂</b>입니다.
            </p>
            <button onClick={nextModal} className="mt-5 w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700">
              확인 ({modalIndex + 1}/{results.length})
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
