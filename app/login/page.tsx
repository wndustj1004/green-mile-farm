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
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500'

  return (
    <main className="flex min-h-screen items-center justify-center bg-green-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-green-700">로그인</h1>
        <p className="mb-6 text-sm text-gray-500">그린마일 팜 챌린지 🌱</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">아이디</label>
            <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value)} placeholder="아이디" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">비밀번호</label>
            <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" />
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50">
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          아직 회원이 아니신가요?{' '}
          <Link href="/signup" className="font-medium text-green-700 hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </main>
  )
}
