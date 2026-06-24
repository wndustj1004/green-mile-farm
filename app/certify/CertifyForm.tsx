'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import exifr from 'exifr'
import { useDaumPostcodePopup } from 'react-daum-postcode'
import { createClient } from '@/lib/supabase/client'
import { TRANSPORTS, type TransportKey } from '@/lib/transport'
import { submitCertification, calcDistanceAction, type CertifyResult } from './actions'

const PHOTO_SLOTS = [
  { key: 'start1', label: '시작 · 현장 촬영' },
  { key: 'start2', label: '시작 · 지도 스크린샷' },
  { key: 'end1', label: '종료 · 현장 촬영' },
  { key: 'end2', label: '종료 · 지도 스크린샷' },
] as const

export default function CertifyForm({ userId }: { userId: string }) {
  const router = useRouter()
  const supabase = createClient()
  const openPostcode = useDaumPostcodePopup()

  const [transport, setTransport] = useState<TransportKey | ''>('')
  const [mode, setMode] = useState<'auto' | 'manual'>('auto')
  const [distance, setDistance] = useState('')
  const [startAddress, setStartAddress] = useState('')
  const [endAddress, setEndAddress] = useState('')
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [calcInfo, setCalcInfo] = useState('')
  const [calcLoading, setCalcLoading] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CertifyResult | null>(null)

  function setFile(slot: string, file: File | null) {
    setError('')
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 첨부할 수 있습니다.')
        return
      }
      if (file.size > 8 * 1024 * 1024) {
        setError('사진 용량은 8MB 이하여야 합니다. (현재 ' + (file.size / 1024 / 1024).toFixed(1) + 'MB)')
        return
      }
    }
    setPreviews((prev) => {
      if (prev[slot]) URL.revokeObjectURL(prev[slot])
      const next = { ...prev }
      if (file) next[slot] = URL.createObjectURL(file)
      else delete next[slot]
      return next
    })
    setFiles((prev) => ({ ...prev, [slot]: file }))
  }

  function searchAddress(which: 'start' | 'end') {
    openPostcode({
      onComplete: (data) => {
        if (which === 'start') setStartAddress(data.address)
        else setEndAddress(data.address)
      },
    })
  }

  // 주소 → 카카오 자동 거리 계산
  async function handleCalc() {
    setError('')
    setCalcInfo('')
    if (!startAddress.trim() || !endAddress.trim())
      return setError('시작/종료 주소를 먼저 입력해주세요.')
    setCalcLoading(true)
    const res = await calcDistanceAction(startAddress, endAddress)
    setCalcLoading(false)
    if ('error' in res) return setError(res.error)
    setDistance(String(res.km))
    setCalcInfo(`${res.method} 기준 ${res.km}km 계산됨`)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!transport) return setError('교통수단을 선택해주세요.')
    const dist = parseFloat(distance)
    if (!dist || dist <= 0)
      return setError(
        mode === 'auto'
          ? '거리 자동 계산을 먼저 눌러주세요.'
          : '이동 거리를 0보다 큰 숫자로 입력해주세요.'
      )
    const missing = PHOTO_SLOTS.filter((s) => !files[s.key])
    if (missing.length > 0)
      return setError('사진 4장을 모두 첨부해주세요 (시작·종료 각 현장 촬영 + 지도 스크린샷).')

    setLoading(true)
    try {
      // 1) 사진 업로드 + EXIF 추출
      const photos: Record<string, string> = {}
      const exif: Record<string, unknown> = {}
      for (const slot of PHOTO_SLOTS) {
        const file = files[slot.key]
        if (!file) continue
        try {
          exif[slot.key] = await exifr.parse(file, [
            'DateTimeOriginal',
            'GPSLatitude',
            'GPSLongitude',
          ])
        } catch {
          exif[slot.key] = null
        }
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${userId}/${Date.now()}_${slot.key}.${ext}`
        const { error: upErr } = await supabase.storage
          .from('certification-photos')
          .upload(path, file)
        if (upErr) throw new Error('사진 업로드 실패: ' + upErr.message)
        photos[slot.key] = path
      }

      // 2) 서버 등록 (거리·CO₂ 계산은 서버에서)
      const res = await submitCertification({
        transport: transport as TransportKey,
        distanceKm: dist,
        startAddress,
        endAddress,
        photos,
        exif,
      })
      if ('error' in res) {
        setError(res.error)
        setLoading(false)
        return
      }
      setResult(res.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
      setLoading(false)
    }
  }

  function closeModal() {
    router.push('/dashboard')
    router.refresh()
  }

  const inputCls =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

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
          <p className="mb-5 text-sm text-gray-500">친환경 이동을 인증하고 작물을 키워요!</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 교통수단 */}
            <div>
              <label className={labelCls}>교통수단</label>
              <div className="grid grid-cols-4 gap-2">
                {TRANSPORTS.map((t) => (
                  <button
                    type="button"
                    key={t.key}
                    onClick={() => setTransport(t.key)}
                    className={`rounded-lg border py-3 text-center text-sm ${
                      transport === t.key
                        ? 'border-green-600 bg-green-50 font-semibold text-green-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <div className="text-xl">{t.icon}</div>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 거리 입력 방식 토글 */}
            <div>
              <label className={labelCls}>이동 거리</label>
              <div className="mb-3 grid grid-cols-2 gap-2">
                {(['auto', 'manual'] as const).map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => {
                      setMode(m)
                      setCalcInfo('')
                    }}
                    className={`rounded-lg border py-2 text-sm ${
                      mode === m
                        ? 'border-green-600 bg-green-50 font-semibold text-green-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    {m === 'auto' ? '주소로 자동 계산' : '직접 입력'}
                  </button>
                ))}
              </div>

              {/* 시작/종료 위치 */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input className={inputCls} value={startAddress} onChange={(e) => setStartAddress(e.target.value)} placeholder="시작 위치 (예: 전남대 정문)" />
                  {mode === 'auto' && (
                    <button type="button" onClick={() => searchAddress('start')} className="shrink-0 rounded-lg bg-gray-100 px-2 text-xs text-gray-600 hover:bg-gray-200">
                      주소검색
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <input className={inputCls} value={endAddress} onChange={(e) => setEndAddress(e.target.value)} placeholder="종료 위치 (예: 광주역)" />
                  {mode === 'auto' && (
                    <button type="button" onClick={() => searchAddress('end')} className="shrink-0 rounded-lg bg-gray-100 px-2 text-xs text-gray-600 hover:bg-gray-200">
                      주소검색
                    </button>
                  )}
                </div>
              </div>

              {/* 거리 값 */}
              {mode === 'auto' ? (
                <div className="mt-3">
                  <button type="button" onClick={handleCalc} disabled={calcLoading} className="w-full rounded-lg border border-green-600 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50">
                    {calcLoading ? '계산 중...' : '📍 거리 자동 계산'}
                  </button>
                  {distance && (
                    <p className="mt-2 text-center text-sm font-semibold text-gray-700">
                      이동 거리: {distance} km
                    </p>
                  )}
                  {calcInfo && <p className="mt-1 text-center text-xs text-gray-400">{calcInfo}</p>}
                </div>
              ) : (
                <div className="mt-3">
                  <input type="number" step="0.1" min="0" className={inputCls} value={distance} onChange={(e) => setDistance(e.target.value)} placeholder="이동 거리 km (예: 2.5)" />
                </div>
              )}
            </div>

            {/* 사진 */}
            <div>
              <label className={labelCls}>사진 (필수 · 시작/종료 각 2장)</label>
              <p className="mb-2 text-xs text-gray-400">
                위치마다 ① 현장 직접 촬영 ② 지도 앱 현재위치 스크린샷 1장씩.
                <br />
                원본 사진을 올리면 촬영시각·위치가 자동 기록됩니다(부정 확인용).
              </p>
              <div className="grid grid-cols-2 gap-2">
                {PHOTO_SLOTS.map((slot) => (
                  <label key={slot.key} className="relative flex h-24 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 text-center text-xs text-gray-500 hover:bg-gray-50">
                    {previews[slot.key] ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={previews[slot.key]} alt={slot.label} className="absolute inset-0 h-full w-full object-cover" />
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

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={loading} className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50">
              {loading ? '등록 중...' : '등록하기'}
            </button>
          </form>
        </div>
      </div>

      {/* 결과 모달 */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-xl">
            <div className="text-5xl">🌱</div>
            <h2 className="mt-3 text-lg font-bold text-green-700">인증 완료!</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-700">
              <b>{result.name}</b>님이 <b>{result.startAddress}</b>에서{' '}
              <b>{result.endAddress}</b>까지 <b>{result.transportLabel}</b>으로{' '}
              <b>{result.distanceKm}km</b>를 이동하면서 감축된 CO₂량은 차량 이용 대비{' '}
              <b className="text-green-700">{result.co2Kg.toFixed(2)} kgCO₂</b>입니다.
            </p>
            <button onClick={closeModal} className="mt-5 w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700">
              확인
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
