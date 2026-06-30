'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { reviewCert } from '../actions'

export default function CertActions({ id }: { id: string }) {
  const router = useRouter()
  const [showReject, setShowReject] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function approve() {
    setError('')
    setBusy(true)
    const res = await reviewCert(id, 'approved')
    setBusy(false)
    if ('error' in res) setError(res.error)
    else router.refresh()
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

  function closeModal() {
    setShowReject(false)
    setReason('')
    setError('')
  }

  return (
    <>
      <div className="mt-3 flex gap-2">
        <button
          onClick={approve}
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
      {error && !showReject && <p className="mt-1 text-xs text-red-500">{error}</p>}

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
              className="mt-3 w-full rounded-lg border border-gray-300 p-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
            <div className="mt-4 flex gap-2">
              <button
                onClick={closeModal}
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
