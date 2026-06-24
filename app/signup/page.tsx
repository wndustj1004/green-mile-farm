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

  const base = 'w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1'
  const inputCls = (field: keyof typeof errors) =>
    `${base} ${
      showErr(field)
        ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
        : 'border-gray-300 focus:border-green-500 focus:ring-green-500'
    }`

  return (
    <main className="min-h-screen bg-green-50 py-10 px-4">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-7 shadow-sm">
        <h1 className="mb-1 text-2xl font-bold text-green-700">회원가입</h1>
        <p className="mb-6 text-sm text-gray-500">그린마일 팜 챌린지에 참여해요 🌱</p>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* 이름 */}
          <Field label="이름(닉네임)" error={showErr('name')}>
            <input className={inputCls('name')} value={name} onChange={(e) => setName(e.target.value)} onBlur={() => touch('name')} placeholder="홍길동" />
          </Field>

          {/* 핸드폰 */}
          <Field label="핸드폰 번호" error={showErr('phone')}>
            <input className={inputCls('phone')} value={phone} onChange={(e) => handlePhone(e.target.value)} onBlur={() => touch('phone')} placeholder="010-0000-0000" inputMode="numeric" />
          </Field>

          {/* 아이디 + 중복확인 */}
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

          {/* 비밀번호 */}
          <Field label="비밀번호" error={showErr('password')}>
            <input type="password" className={inputCls('password')} value={password} onChange={(e) => setPassword(e.target.value)} onBlur={() => touch('password')} placeholder="8자 이상" />
          </Field>

          {/* 비밀번호 확인 */}
          <Field label="비밀번호 확인" error={showErr('passwordConfirm')}>
            <input type="password" className={inputCls('passwordConfirm')} value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} onBlur={() => touch('passwordConfirm')} placeholder="비밀번호를 다시 입력" />
          </Field>

          {/* 주소 */}
          <Field label="주소" error={showErr('address')}>
            <div className="flex gap-2">
              <input className={inputCls('address')} value={address} readOnly placeholder="주소 검색을 눌러주세요" />
              <button type="button" onClick={searchAddress} className="shrink-0 rounded-lg bg-green-600 px-3 text-sm font-medium text-white hover:bg-green-700">
                주소 검색
              </button>
            </div>
            <input className={`${base} border-gray-300 focus:border-green-500 focus:ring-green-500 mt-2`} value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} placeholder="상세주소 (동/호수 등)" />
          </Field>

          {/* 이메일 */}
          <Field label="이메일" error={showErr('email')}>
            <input type="email" className={inputCls('email')} value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => touch('email')} placeholder="example@email.com" />
          </Field>

          {/* 동의 */}
          <div className="space-y-2 rounded-lg bg-gray-50 p-3">
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-green-600" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} />
              <span>만 14세 이상입니다.</span>
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-700">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-green-600" checked={privacyAgreed} onChange={(e) => setPrivacyAgreed(e.target.checked)} />
              <span>
                개인정보 수집·이용에 동의합니다.
                <span className="mt-1 block text-xs text-gray-400">
                  수집항목: 이름·연락처·주소·이메일 / 목적: 챌린지 운영 및 상품 수령 / 보관: 사업 종료 후 3개월
                </span>
              </span>
            </label>
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className="w-full rounded-lg bg-green-600 py-3 font-semibold text-white hover:bg-green-700 disabled:opacity-50">
            {loading ? '가입 중...' : '가입하기'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-medium text-green-700 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </main>
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
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'
  return (
    <div>
      <label className={labelCls}>{label}</label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className={`mt-1 text-xs ${hint.tone === 'ok' ? 'text-green-600' : hint.tone === 'bad' ? 'text-red-500' : 'text-gray-400'}`}>
          {hint.text}
        </p>
      ) : null}
    </div>
  )
}
