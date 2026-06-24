'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function loginAction(
  username: string,
  password: string
): Promise<{ error: string } | void> {
  if (!username?.trim() || !password) {
    return { error: '아이디와 비밀번호를 입력해주세요.' }
  }

  // 1) 아이디 → 이메일 변환 (관리자 연결로 조회, 이메일은 외부에 노출되지 않음)
  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('email')
    .eq('username', username)
    .maybeSingle()

  // 보안상 아이디/비번 오류를 구분하지 않고 동일 메시지 사용
  const failMsg = '아이디 또는 비밀번호가 올바르지 않습니다.'
  if (!profile?.email) return { error: failMsg }

  // 2) 이메일 + 비밀번호로 실제 로그인 (세션 쿠키 설정)
  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password,
  })
  if (error) return { error: failMsg }

  redirect('/dashboard')
}
