'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // 개발 중 콘솔에 에러 기록 (운영에선 무시됨)
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-green-50 px-4 text-center">
      <div className="text-5xl">😢</div>
      <h1 className="mt-4 text-xl font-bold text-gray-800">문제가 발생했어요</h1>
      <p className="mt-2 text-sm text-gray-500">
        일시적인 오류일 수 있어요. 다시 시도해주세요.
        <br />
        계속 발생하면 운영진에게 알려주세요.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
          다시 시도
        </button>
        <Link href="/dashboard" className="rounded-lg border border-green-600 px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-100">
          대시보드로
        </Link>
      </div>
    </main>
  )
}
