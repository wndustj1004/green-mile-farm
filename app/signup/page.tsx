'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useDaumPostcodePopup } from 'react-daum-postcode'
import { signUpAction, checkUsernameAvailable } from './actions'
import {
  checkName,
  checkPhone,
  checkUsername,
  checkPassword,
  checkPasswordConfirm,
  checkAddress,
  checkEmail,
} from '@/lib/validation'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [address, setAddress] = useState('')
  const [addressDetail, setAddressDetail] = useState('')
  const [email, setEmail] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [privacyAgreed, setPrivacyAgreed] = useState(false)

  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const openPostcode = useDaumPostcodePopup()

  const errors = {
    name: checkName(name),
    phone: checkPhone(phone),
    username: checkUsername(username),
    password: checkPassword(password),
    passwordConfirm: checkPasswordConfirm(password, passwordConfirm),
    address: checkAddress(address),
    email: checkEmail(email),
  }

  function touch(field: string) {
    setTouched((t) => ({ ...t, [field]: true }))
  }
  function showErr(field: keyof typeof errors): string {
    return touched[field] ? errors[field] : ''
  }

  function handlePhone(v: string) {
    const digits = v.replace(/\D/g, '').slice(0, 11)
    let out = digits
    if (digits.length > 7) out = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    else if (digits.length > 3) out = `${digits.slice(0, 3)}-${digits.slice(3)}`
    setPhone(out)
  }

  function handleUsername(v: string) {
    // 허용 문자(영문·숫자·_)만 입력되도록 즉시 필터
    setUsername(v.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))
    setUsernameStatus('idle')
  }

  async function onUsernameBlur() {
    touch('username')
    if (checkUsername(username)) {
      setUsernameStatus('invalid')
      return
    }
    setUsernameStatus('checking')
    try {
      const { available } = await checkUsernameAvailable(username)
      setUsernameStatus(available ? 'available' : 'taken')
    } catch {
      setUsernameStatus('idle')
    }
  }

  function searchAddress() {
    openPostcode({ onComplete: (data) => setAddress(data.address) })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    // 모든 필드 touched 처리 → 인라인 오류 노출
    setTouched({ name: true, phone: true, username: true, password: true, passwordConfirm: true, address: true, email: true })

    const firstError = Object.values(errors).find(Boolean)
    if (firstError) return setError(firstError)
    if (usernameStatus === 'taken') return setError('이미 사용 중인 아이디입니다.')
    if (!ageConfirmed) return setError('만 14세 이상 확인에 동의해주세요.')
    if (!privacyAgreed) return setError('개인정보 수집·이용에 동의해주세요.')

    setLoading(true)
    const fullAddress = addressDetail ? `${address} ${addressDetail}` : address
    const result = await signUpAction({
      name: name.trim(),
      phone,
      username,
      password,
      address: fullAddress,
      email: email.trim(),
      ageConfirmed,
      privacyAgreed,
    })
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  const base = 'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1'
  const inputCls = (field: keyof typeof errors) =>
    `${base} ${
      showErr(field)
        ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
        : 'border-gm-line focus:border-gm-leaf focus:ring-gm-leaf'
    }`

  return (
    <main className="min-h-screen bg-gm-cream2 px-4 py-10">
      <div className="mx-auto max-w-md overflow-hidden rounded-3xl bg-gm-cream shadow-sm">
        <div className="bg-gm-sage py-7 text-center">
          <div className="inline-flex items-center gap-2">
            <LeafMark />
            <span className="text-base font-bold text-gm-ink2">그린마일 팜</span>
          </div>
        </div>

        <div className="p-7">
          <h1 className="text-[22px] font-bold text-gm-ink2">회원가입</h1>
          <p className="mb-6 mt-1.5 text-[13px] text-gm-muted2">챌린지에 참여해요 🌱</p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <GroupLabel>기본 정보</GroupLabel>

              <Field label="이름(닉네임)" error={showErr('name')}>
                <input className={inputCls('name')} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => touch('name')} placeholder="홍길동" />
              </Field>

              <Field
                label="아이디"
                error={showErr('username')}
                hint={
                  !showErr('username') && usernameStatus === 'available' ? { text: '✓ 사용 가능한 아이디예요.', tone: 'ok' }
                  : usernameStatus === 'taken' ? { text: '이미 사용 중인 아이디예요.', tone: 'bad' }
                  : usernameStatus === 'checking' ? { text: '확인 중...', tone: 'muted' }
                  : undefined
                }
              >
                <input className={inputCls('username')} value={username} onChange={(e) => handleUsername(e.target.value)} onBlur={onUsernameBlur} placeholder="영문·숫자 4~20자" />
              </Field>

              <Field label="비밀번호" error={showErr('password')}>
                <input type="password" className={inputCls('password')} value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => touch('password')} placeholder="8자 이상" />
              </Field>

              <Field label="비밀번호 확인" error={showErr('passwordConfirm')}>
                <input type="password" className={inputCls('passwordConfirm')} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} onBlur={() => touch('passwordConfirm')} placeholder="비밀번호를 다시 입력" />
              </Field>
            </div>

            {/* 연락처 · 배송 */}
            <div className="space-y-4">
              <GroupLabel>연락처 · 배송</GroupLabel>

              <Field label="핸드폰 번호" error={showErr('phone')}>
                <input className={inputCls('phone')} value={phone} onChange={(e) => handlePhone(e.target.value)} onBlur={() => touch('phone')} placeholder="010-0000-0000" inputMode="numeric" />
              </Field>

              <Field label="주소" error={showErr('address')}>
                <div className="flex gap-2">
                  <input className={inputCls('address')} value={address} readOnly placeholder="주소 검색을 눌러주세요" />
                  <button type="button" onClick={searchAddress} className="shrink-0 rounded-lg bg-gm-green px-3 text-sm font-bold text-white hover:opacity-90">
                    검색
                  </button>
                </div>
                <input className={`${base} mt-2 border-gm-line focus:border-gm-leaf focus:ring-gm-leaf`} value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} placeholder="상세주소 (동/호수 등)" />
              </Field>

              <Field label="이메일" error={showErr('email')}>
                <input type="email" className={inputCls('email')} value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => touch('email')} placeholder="example@email.com" />
              </Field>
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3">
              <GroupLabel>약관 동의</GroupLabel>
              <div className="space-y-2.5 rounded-xl bg-gm-cream2 p-3.5">
                <label className="flex items-start gap-2 text-[13px] text-gm-body">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-gm-green" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} />
                  <span>만 14세 이상입니다.</span>
                </label>
                <label className="flex items-start gap-2 text-[13px] text-gm-body">
                  <input type="checkbox" className="mt-0.5 h-4 w-4 accent-gm-green" checked={privacyAgreed} onChange={(e) => setPrivacyAgreed(e.target.checked)} />
                  <span>
                    개인정보 수집·이용에 동의합니다.
                    <span className="mt-1 block text-[11px] text-gm-muted2">
                      수집항목: 이름·연락처·주소·이메일 / 목적: 챌린지 운영 및 상품 수령 / 보관: 사업 종료 후 3개월
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-gm-green py-3.5 text-[15px] font-bold text-white hover:opacity-90 disabled:opacity-50"
            >
              {loading ? '가입 중...' : '가입하기'}
            </button>
          </form>

          <p className="mt-5 text-center text-[13px] text-gm-muted2">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-bold text-gm-green hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

function GroupLabel({ children }: { children: string }) {
  return <p className="text-xs font-bold tracking-wider text-gm-leaf">{children}</p>
}

function LeafMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M12 21 C5 17 4 10 4 6 C9 6 12 9 12 14 C12 9 15 6 20 6 C20 10 19 17 12 21 Z" fill="#3a7a4e" />
    </svg>
  )
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: { text: string; tone: 'ok' | 'bad' | 'muted' }
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-[13px] font-semibold text-gm-body">{label}</label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className={`mt-1 text-xs ${hint.tone === 'ok' ? 'text-gm-leaf' : hint.tone === 'bad' ? 'text-red-500' : 'text-gm-muted2'}`}>
          {hint.text}
        </p>
      ) : null}
    </div>
  )
}
