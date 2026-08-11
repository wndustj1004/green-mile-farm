'use server'

// 아이디 찾기 / 비밀번호 재설정 — 서버에서만 도는 코드.
//
// 왜 '이메일로 링크 보내기'가 아니라 '가입정보 확인' 방식인가?
//  - 참여자 15명 규모의 동아리 챌린지라 메일 발송 인프라(SMTP)가 없고,
//    Supabase 기본 메일은 시간당 발송 수가 매우 적어 실패 위험이 큽니다.
//  - 그래서 회원가입 때 적은 정보(이름·휴대폰·이메일·아이디)를 맞춰 본인을 확인합니다.
//
// 대신 아래 4가지로 안전장치를 걸었습니다.
//  ① 비밀번호 재설정은 4개 항목(아이디+이름+휴대폰+이메일)이 '전부' 맞아야 통과
//  ② 10분 안에 5번 실패하면 차단 (recovery_attempts 표)
//  ③ 통과해도 비번을 바로 못 바꾸고, 10분짜리 1회용 열쇠를 받아 2단계에서 변경
//  ④ 운영진(is_admin) 계정은 이 방법으로 재설정 불가 — 계정 탈취 시 피해가 커서

import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { createHash, randomBytes, timingSafeEqual } from 'crypto'
import { checkPassword, checkPasswordConfirm } from '@/lib/validation'
import {
  NO_MATCH_MSG,
  TOO_MANY_MSG,
  RATE_LIMIT,
  RESET_TOKEN_MINUTES,
  phoneDigits,
  formatPhone,
  normEmail,
  normName,
} from '@/lib/recovery'

type SupabaseAdmin = ReturnType<typeof createAdminClient>
type Kind = 'find_id' | 'reset_pw'

// ---------------------------------------------------------------
// 공통 도우미
// ---------------------------------------------------------------

/** 접속자 IP (Vercel은 x-forwarded-for 헤더로 알려줍니다) */
function clientIp(): string {
  const h = headers()
  const fwd = h.get('x-forwarded-for') || ''
  return fwd.split(',')[0].trim() || h.get('x-real-ip') || 'unknown'
}

/** 시도 횟수 확인 — 최근 10분간 실패가 5번 이상이면 true(=막아야 함) */
async function isRateLimited(admin: SupabaseAdmin, kind: Kind, keys: string[]): Promise<boolean> {
  const since = new Date(Date.now() - RATE_LIMIT.windowMinutes * 60_000).toISOString()
  const { count, error } = await admin
    .from('recovery_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('kind', kind)
    .eq('success', false)
    .in('attempt_key', keys)
    .gte('attempted_at', since)
  if (error) return false // 표가 없거나 조회 실패 시 기능 자체를 막지는 않음
  return (count ?? 0) >= RATE_LIMIT.maxFails
}

/** 시도 1건 기록 */
async function logAttempt(admin: SupabaseAdmin, kind: Kind, keys: string[], success: boolean) {
  await admin
    .from('recovery_attempts')
    .insert(keys.map((attempt_key) => ({ kind, attempt_key, success })))
}

/** 문자열 비교(길이·내용 노출을 줄이기 위해 상수시간 비교 사용) */
function sameText(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8')
  const bufB = Buffer.from(b, 'utf8')
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

function sha256(v: string): string {
  return createHash('sha256').update(v).digest('hex')
}

// ---------------------------------------------------------------
// ① 아이디 찾기 — 이름 + 휴대폰 + 이메일이 모두 맞으면 아이디를 알려줍니다.
// ---------------------------------------------------------------

export type FindIdInput = { name: string; phone: string; email: string }
export type FindIdResult =
  | { error: string }
  | { username: string; joinedAt: string }

export async function findIdAction(input: FindIdInput): Promise<FindIdResult> {
  const name = normName(input.name)
  const phone = phoneDigits(input.phone)
  const email = normEmail(input.email)
  if (!name || !phone || !email) return { error: '모든 항목을 입력해주세요.' }

  const admin = createAdminClient()
  const keys = [`ip:${clientIp()}`, `email:${email}`]
  if (await isRateLimited(admin, 'find_id', keys)) return { error: TOO_MANY_MSG }

  // 후보 좁히기는 '완전 일치(eq)'로만 합니다.
  // ※ ilike를 쓰면 이메일에 %나 _를 넣어 와일드카드로 악용할 수 있어서 쓰지 않습니다.
  //   휴대폰은 회원가입에서 010-0000-0000 형식만 통과하므로 그대로 맞춰 조회합니다.
  const { data: rows } = await admin
    .from('profiles')
    .select('username, name, phone, email, created_at')
    .eq('phone', formatPhone(input.phone))

  // 이름·이메일은 서버에서 '정리된 값'끼리 비교(대소문자·공백 차이를 구제)
  const hit = (rows ?? []).find(
    (r) => sameText(normName(r.name ?? ''), name) && sameText(normEmail(r.email ?? ''), email)
  )

  await logAttempt(admin, 'find_id', keys, !!hit)
  if (!hit) return { error: NO_MATCH_MSG }

  return { username: hit.username, joinedAt: hit.created_at }
}

// ---------------------------------------------------------------
// ② 비밀번호 재설정 1단계 — 본인확인 후 10분짜리 임시 열쇠 발급
// ---------------------------------------------------------------

export type VerifyResetInput = {
  username: string
  name: string
  phone: string
  email: string
}
export type VerifyResetResult = { error: string } | { token: string; username: string }

export async function verifyForResetAction(input: VerifyResetInput): Promise<VerifyResetResult> {
  const username = (input.username || '').trim()
  const name = normName(input.name)
  const phone = phoneDigits(input.phone)
  const email = normEmail(input.email)
  if (!username || !name || !phone || !email) return { error: '모든 항목을 입력해주세요.' }

  const admin = createAdminClient()
  const keys = [`ip:${clientIp()}`, `user:${username.toLowerCase()}`]
  if (await isRateLimited(admin, 'reset_pw', keys)) return { error: TOO_MANY_MSG }

  const { data: profile } = await admin
    .from('profiles')
    .select('id, username, name, phone, email, is_admin')
    .eq('username', username)
    .maybeSingle()

  const matched =
    !!profile &&
    sameText(normName(profile.name ?? ''), name) &&
    sameText(phoneDigits(profile.phone ?? ''), phone) &&
    sameText(normEmail(profile.email ?? ''), email)

  await logAttempt(admin, 'reset_pw', keys, matched)
  if (!matched || !profile) return { error: NO_MATCH_MSG }

  // 운영진 계정은 이 경로로 못 바꿉니다(탈취 시 피해가 큼).
  // 운영진 본인은 scripts/reset-password.mjs 또는 Supabase 대시보드로 변경하세요.
  if (profile.is_admin) {
    return {
      error:
        '운영진 계정은 보안을 위해 여기서 재설정할 수 없습니다. 관리자에게 직접 문의해주세요.',
    }
  }

  // 임시 열쇠 발급 — 원본은 사용자 브라우저에만, DB에는 지문(해시)만 저장
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + RESET_TOKEN_MINUTES * 60_000).toISOString()

  // 이 사람에게 이전에 발급된(아직 안 쓴) 열쇠는 무효화 + 만료된 찌꺼기 정리
  await admin.from('password_reset_tokens').delete().eq('user_id', profile.id).is('used_at', null)
  await admin.from('password_reset_tokens').delete().lt('expires_at', new Date().toISOString())

  const { error: insErr } = await admin.from('password_reset_tokens').insert({
    user_id: profile.id,
    token_hash: sha256(token),
    expires_at: expiresAt,
  })
  if (insErr) return { error: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }

  return { token, username: profile.username }
}

// ---------------------------------------------------------------
// ③ 비밀번호 재설정 2단계 — 임시 열쇠로 새 비밀번호 저장
// ---------------------------------------------------------------

export type ResetPasswordResult = { error: string } | { ok: true }

export async function resetPasswordAction(
  token: string,
  password: string,
  passwordConfirm: string
): Promise<ResetPasswordResult> {
  const fieldError = checkPassword(password) || checkPasswordConfirm(password, passwordConfirm)
  if (fieldError) return { error: fieldError }
  if (!token) return { error: '본인확인 정보가 없습니다. 처음부터 다시 진행해주세요.' }

  const admin = createAdminClient()
  const expiredMsg = '본인확인 유효시간(10분)이 지났습니다. 처음부터 다시 진행해주세요.'

  const { data: row } = await admin
    .from('password_reset_tokens')
    .select('id, user_id, expires_at, used_at')
    .eq('token_hash', sha256(token))
    .maybeSingle()

  if (!row || row.used_at || new Date(row.expires_at) < new Date()) return { error: expiredMsg }

  // 실제 비밀번호 변경 (Supabase Auth)
  const { error } = await admin.auth.admin.updateUserById(row.user_id, { password })
  if (error) return { error: '비밀번호 변경에 실패했습니다: ' + error.message }

  // 1회용 처리 — 같은 열쇠를 다시 못 쓰게 사용 시각 기록
  await admin
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id)

  return { ok: true }
}
