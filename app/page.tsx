import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  // 이미 로그인했으면 바로 대시보드로
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-green-50 px-4 text-center">
      <div className="text-6xl">🍅</div>
      <h1 className="mt-4 text-3xl font-bold text-green-700">그린마일 팜</h1>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-600">
        걷기·자전거·대중교통으로 줄인 CO₂만큼 내 작물이 자라요.
        <br />
        다 키우면 진짜 작물을 받아요! 🌱
      </p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-3">
        <Link href="/signup" className="rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700">
          회원가입
        </Link>
        <Link href="/login" className="rounded-lg border border-green-600 py-3 font-semibold text-green-700 hover:bg-green-100">
          로그인
        </Link>
      </div>
    </main>
  )
}
