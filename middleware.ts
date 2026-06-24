// 모든 페이지 요청 전에 실행되어 로그인 세션을 유지합니다.
import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  // 정적 파일(이미지, 폰트 등)은 제외하고 실제 페이지에만 적용
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
