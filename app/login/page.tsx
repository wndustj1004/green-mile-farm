'use client'

import { useState } from 'react'
import Link from 'next/link'
import { loginAction } from './actions'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await loginAction(username, password)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const inputCls =
    'w-full rounded-lg border border-gm-line px-3 py-2.5 text-sm focus:border-gm-leaf focus:outline-none focus:ring-1 focus:ring-gm-leaf'

  return (
    <main className="flex min-h-screen items-center justify-center bg-gm-cream2 px-4 py-10">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-gm-cream shadow-sm">
        <div className="bg-gm-sage py-8 text-center">
          <div className="inline-flex items-center gap-2">
            <LeafMark />
            <span className="text-base font-bold text-gm-ink2">그린마일 팜</span>
          </div>
        </div>

        <div className="p-7">
          <h1 className="text-[22px] font-bold text-gm-ink2">로그인</h1>
          <p className="mb-6 mt-1.5 text-[13px] text-gm-muted2">챌린지에 다시 오신 걸 환영해요 🌱</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-gm-body">아이디</label>
              <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="아이디" />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-semibold text-gm-body">비밀번호</label>
              <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gm-green py-3.5 text-[15px] font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="mt-4 text-center text-[13px]">
            <Link href="/login/find" className="text-gm-muted2 hover:text-gm-green hover:underline">
              아이디 · 비밀번호를 잊으셨나요?
            </Link>
          </p>

          <p className="mt-3 text-center text-[13px] text-gm-muted2">
            아직 회원이 아니신가요?{' '}
            <Link href="/signup" className="font-bold text-gm-green hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

function LeafMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M12 21 C5 17 4 10 4 6 C9 6 12 9 12 14 C12 9 15 6 20 6 C20 10 19 17 12 21 Z" fill="#3a7a4e" />
    </svg>
  )
}
