'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { reviewCert } from '../actions'

export default function CertActions({ id, distanceKm }: { id: string; distanceKm: number }) {
  const router = useRouter()
  const [showReject, setShowReject] = useState(false)
  const [showApprove, setShowApprove] = useState(false)
  const [reason, setReason] = useState('')
  const [dist, setDist] = useState(String(distanceKm))
  const [distReason, setDistReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const newKm = parseFloat(dist)
  const changed = !isNaN(newKm) && newKm !== distanceKm

  async function confirmApprove() {
    setError('')
    if (changed) {
      if (!newKm || newKm <= 0) return setError('수정 거리는 0보다 큰 숫자여야 합니다.')
      if (!distReason.trim()) return setError('거리 수정 사유를 입력해주세요.')
    }
    setBusy(true)
    const res = await reviewCert(id, 'approved', undefined, changed ? { newKm, reason: distReason } : undefined)
    setBusy(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setShowApprove(false)
    router.refresh()
  }

  async function confirmReject() {
    if (!reason.trim()) return
    setError('')
    setBusy(true)
    const res = await reviewCert(id, 'rejected', reason)
    setBusy(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setShowReject(false)
    setReason('')
    router.refresh()
  }

  function closeApprove() {
    setShowApprove(false)
    setDist(String(distanceKm))
    setDistReason('')
    setError('')
  }
  function closeReject() {
    setShowReject(false)
    setReason('')
    setError('')
  }

  const input =
    'w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500'

  return (
    <>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setShowApprove(true)}
          disabled={busy}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          승인
        </button>
        <button
          onClick={() => setShowReject(true)}
          disabled={busy}
          className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
        >
          반려
        </button>
      </div>
      {error && !showReject && !showApprove && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* 승인 (이동거리 선택적 수정) 모달 */}
      {showApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-gray-800">인증 승인</h3>
            <p className="mt-1 text-xs text-gray-500">
              자동 계산 거리가 정확하면 그대로 승인하세요. 필요하면 올바른 값으로 수정할 수 있어요.
            </p>

            <label className="mt-3 block text-xs font-medium text-gray-600">이동 거리 (km)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={dist}
              onChange={(e) => setDist(e.target.value)}
              className={`${input} mt-1`}
            />
            <p className="mt-1 text-xs text-gray-400">자동 계산값: {distanceKm}km</p>

            {changed && (
              <>
                <label className="mt-3 block text-xs font-medium text-gray-600">거리 수정 사유 (필수)</label>
                <textarea
                  value={distReason}
                  onChange={(e) => setDistReason(e.target.value)}
                  rows={2}
                  placeholder="예: 실제 이동 경로와 달라 보정했습니다."
                  className={`${input} mt-1`}
                />
                <p className="mt-1 text-xs text-amber-600">수정 시 CO₂ 감축량이 다시 계산되어 반영됩니다.</p>
              </>
            )}

            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                onClick={closeApprove}
                disabled={busy}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={confirmApprove}
                disabled={busy}
                className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? '처리 중...' : changed ? '수정 후 승인' : '승인'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 반려 사유 입력 모달 */}
      {showReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-bold text-gray-800">반려 사유 입력</h3>
            <p className="mt-1 text-xs text-gray-500">사유는 기록으로 저장됩니다. (필수)</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="예: 사진의 촬영 위치·시각이 인증 내용과 맞지 않습니다."
              className={`${input} mt-3`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                onClick={closeReject}
                disabled={busy}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
              >
                취소
              </button>
              <button
                onClick={confirmReject}
                disabled={busy || !reason.trim()}
                className="flex-1 rounded-lg bg-red-500 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? '처리 중...' : '반려 확정'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
