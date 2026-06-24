// 서버(서버 컴포넌트 / 서버 액션 / 라우트 핸들러)에서 Supabase에 접속하는 연결.
// 로그인 세션을 쿠키로 읽고 씁니다. (Next.js 14 기준)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // 서버 컴포넌트에서는 쿠키 쓰기가 막혀 예외가 날 수 있어 무시.
          // 미들웨어/서버액션에서는 정상적으로 세션이 갱신됩니다.
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // ignore
          }
        },
      },
    }
  )
}
