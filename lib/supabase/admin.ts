// 서버 전용 '관리자' 연결 — Secret 키를 사용해 보안규칙(RLS)을 우회합니다.
// 절대 브라우저(클라이언트 컴포넌트)에서 import하지 마세요. 서버에서만 사용.
// 용도: 회원가입 시 아이디 중복 확인, 로그인 시 아이디→이메일 변환 등.
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY가 .env.local에 없습니다. Supabase Settings > API > Secret key를 복사해 넣어주세요.'
    )
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
