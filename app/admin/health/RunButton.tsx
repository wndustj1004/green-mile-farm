'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { runHealthNow } from './actions'

export default function RunButton() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const res = await runHealthNow()
      if ('error' in res) setError(res.error)
      else router.refresh()
    })
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-full bg-gm-green px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gm-leaf disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? '점검하는 중… (10초 정도 걸려요)' : '지금 전체 점검 실행'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
