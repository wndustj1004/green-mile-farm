// 브라우저(클라이언트 컴포넌트)에서 Supabase에 접속할 때 사용하는 연결.
// 공개용(Publishable) 키만 쓰므로 안전하며, 보안은 RLS 규칙이 담당합니다.
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
