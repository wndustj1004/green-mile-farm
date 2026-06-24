'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  checkName,
  checkPhone,
  checkUsername,
  checkPassword,
  checkAddress,
  checkEmail,
} from '@/lib/validation'

// 아이디 사용 가능 여부 (회원가입 폼에서 실시간 확인용)
export async function checkUsernameAvailable(
  username: string
): Promise<{ available: boolean }> {
  const formatError = checkUsername(username)
  if (formatError) return { available: false }
  const admin = createAdminClient()
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  return { available: !data }
}

export type SignUpInput = {
  name: string
  phone: string
  username: string
  password: string
  address: string
  email: string
  ageConfirmed: boolean
  privacyAgreed: boolean
}

export async function signUpAction(
  input: SignUpInput
): Promise<{ error: string } | void> {
  // ---- 1) 입력값 검증 (클라이언트와 동일 규칙으로 서버에서도 재확인) ----
  const fieldError =
    checkName(input.name) ||
    checkPhone(input.phone) ||
    checkUsername(input.username) ||
    checkPassword(input.password) ||
    checkAddress(input.address) ||
    checkEmail(input.email)
  if (fieldError) return { error: fieldError }
  if (!input.ageConfirmed) return { error: '만 14세 이상 확인에 동의해주세요.' }
  if (!input.privacyAgreed) return { error: '개인정보 수집·이용에 동의해주세요.' }

  // ---- 2) 아이디 중복 확인 (관리자 연결로 조회) ----
  const admin = createAdminClient()
  const { data: existing } = await admin
    .from('profiles')
    .select('id')
    .eq('username', input.username)
    .maybeSingle()
  if (existing) return { error: '이미 사용 중인 아이디입니다.' }

  // ---- 3) 회원가입 (Auth 계정 생성 + 트리거가 profiles 자동 생성) ----
  const supabase = createClient()
  const { error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        username: input.username,
        name: input.name,
        phone: input.phone,
        address: input.address,
        age_confirmed: input.ageConfirmed,
        privacy_agreed: input.privacyAgreed,
      },
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return { error: '이미 가입된 이메일입니다.' }
    }
    return { error: '회원가입에 실패했습니다: ' + error.message }
  }

  // ---- 4) 성공 → 대시보드로 이동 ----
  redirect('/dashboard')
}
