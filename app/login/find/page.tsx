'use client'

// 아이디 찾기 / 비밀번호 재설정 화면
//  - 탭 2개로 나뉘고, 비밀번호는 [본인확인] → [새 비밀번호 입력] 2단계로 진행합니다.
//  - 실제 확인·변경은 전부 서버(actions.ts)에서 이뤄집니다.

import { useState } from 'react'
import Link from 'next/link'
import { findIdAction, verifyForResetAction, resetPasswordAction } from './actions'
import { checkName, checkPhone, checkEmail, checkUsername, checkPassword, checkPasswordConfirm } from '@/lib/validation'
import { formatPhone } from '@/lib/recovery'

type Tab = 'id' | 'pw'

export default function FindAccountPage() {
  const [tab, setTab] = useState<Tab>('id')

  return (
    <main className="flex min-h-screen items-center justify-center bg-gm-cream2 px-4 py-10">
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-gm-cream shadow-sm">
        <div className="bg-gm-sage py-8 text-center">
          <div className="inline-flex items-center gap-2">
            <LeafMark />
            <span className="text-base font-bold text-gm-ink2">그린마일 팜</span>
          </div>
        </div>

        <div className="p-7">
          <h1 className="text-[22px] font-bold text-gm-ink2">아이디·비밀번호 찾기</h1>
          <p className="mb-5 mt-1.5 text-[13px] text-gm-muted2">
            회원가입 때 적으신 정보로 본인 확인을 해요 🌱
          </p>

          {/* 탭 */}
          <div className="mb-6 flex rounded-full bg-gm-cream2 p-1">
            <TabButton active={tab === 'id'} onClick={() => setTab('id')}>
              아이디 찾기
            </TabButton>
            <TabButton active={tab === 'pw'} onClick={() => setTab('pw')}>
              비밀번호 재설정
            </TabButton>
          </div>

          {tab === 'id' ? <FindIdPanel onGoReset={() => setTab('pw')} /> : <ResetPwPanel />}

          <p className="mt-6 text-center text-[13px] text-gm-muted2">
            <Link href="/login" className="font-bold text-gm-green hover:underline">
              로그인으로 돌아가기
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}

/* =============================================================
   ① 아이디 찾기
   ============================================================= */
function FindIdPanel({ onGoReset }: { onGoReset: () => void }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [found, setFound] = useState<{ username: string; joinedAt: string } | null>(null)

  const errors = { name: checkName(name), phone: checkPhone(phone), email: checkEmail(email) }
  const showErr = (f: keyof typeof errors) => (touched[f] ? errors[f] : '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setTouched({ name: true, phone: true, email: true })
    const first = Object.values(errors).find(Boolean)
    if (first) return setError(first)

    setLoading(true)
    const result = await findIdAction({ name, phone, email })
    setLoading(false)
    if ('error' in result) return setError(result.error)
    setFound(result)
  }

  if (found) {
    return (
      <ResultBox
        title="회원님의 아이디를 찾았어요"
        note={`가입일 ${formatDate(found.joinedAt)}`}
        value={found.username}
      >
        <Link
          href="/login"
          className="block w-full rounded-full bg-gm-green py-3.5 text-center text-[15px] font-bold text-white hover:opacity-90"
        >
          로그인하러 가기
        </Link>
        <button
          type="button"
          onClick={onGoReset}
          className="w-full rounded-full border border-gm-line py-3 text-[14px] font-bold text-gm-body hover:bg-gm-cream2"
        >
          비밀번호도 잊으셨나요?
        </button>
      </ResultBox>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Field label="이름(닉네임)" error={showErr('name')}>
        <input
          className={inputCls(!!showErr('name'))}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          placeholder="가입할 때 적은 이름"
        />
      </Field>

      <Field label="핸드폰 번호" error={showErr('phone')}>
        <input
          className={inputCls(!!showErr('phone'))}
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
          placeholder="010-0000-0000"
          inputMode="numeric"
        />
      </Field>

      <Field label="이메일" error={showErr('email')}>
        <input
          type="email"
          className={inputCls(!!showErr('email'))}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          placeholder="example@email.com"
        />
      </Field>

      <ErrorBox message={error} />
      <SubmitButton loading={loading} idle="아이디 찾기" busy="확인 중..." />
    </form>
  )
}

/* =============================================================
   ② 비밀번호 재설정 (1단계 본인확인 → 2단계 새 비밀번호)
   ============================================================= */
function ResetPwPanel() {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const [username, setUsername] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [pwTouched, setPwTouched] = useState<Record<string, boolean>>({})

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const errors = {
    username: checkUsername(username),
    name: checkName(name),
    phone: checkPhone(phone),
    email: checkEmail(email),
  }
  const showErr = (f: keyof typeof errors) => (touched[f] ? errors[f] : '')

  const pwErrors = {
    password: checkPassword(password),
    passwordConfirm: checkPasswordConfirm(password, passwordConfirm),
  }
  const showPwErr = (f: keyof typeof pwErrors) => (pwTouched[f] ? pwErrors[f] : '')

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setTouched({ username: true, name: true, phone: true, email: true })
    const first = Object.values(errors).find(Boolean)
    if (first) return setError(first)

    setLoading(true)
    const result = await verifyForResetAction({ username, name, phone, email })
    setLoading(false)
    if ('error' in result) return setError(result.error)
    setToken(result.token)
    setStep(2)
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setPwTouched({ password: true, passwordConfirm: true })
    const first = Object.values(pwErrors).find(Boolean)
    if (first) return setError(first)

    setLoading(true)
    const result = await resetPasswordAction(token, password, passwordConfirm)
    setLoading(false)
    if ('error' in result) return setError(result.error)
    setStep(3)
  }

  // --- 완료 ---
  if (step === 3) {
    return (
      <ResultBox title="비밀번호가 변경되었어요" note="새 비밀번호로 로그인해주세요." value={username}>
        <Link
          href="/login"
          className="block w-full rounded-full bg-gm-green py-3.5 text-center text-[15px] font-bold text-white hover:opacity-90"
        >
          로그인하러 가기
        </Link>
      </ResultBox>
    )
  }

  // --- 2단계: 새 비밀번호 ---
  if (step === 2) {
    return (
      <form onSubmit={handleReset} noValidate className="space-y-4">
        <StepBadge current={2} />
        <p className="rounded-xl bg-gm-cream2 px-3.5 py-3 text-[13px] text-gm-body">
          본인 확인이 끝났어요. <b className="text-gm-green">{username}</b> 계정의 새 비밀번호를
          정해주세요.
          <span className="mt-1 block text-[11px] text-gm-muted2">
            10분 안에 완료해야 해요. 시간이 지나면 처음부터 다시 확인합니다.
          </span>
        </p>

        <Field label="새 비밀번호" error={showPwErr('password')}>
          <input
            type="password"
            className={inputCls(!!showPwErr('password'))}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={() => setPwTouched((t) => ({ ...t, password: true }))}
            placeholder="8자 이상"
          />
        </Field>

        <Field label="새 비밀번호 확인" error={showPwErr('passwordConfirm')}>
          <input
            type="password"
            className={inputCls(!!showPwErr('passwordConfirm'))}
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            onBlur={() => setPwTouched((t) => ({ ...t, passwordConfirm: true }))}
            placeholder="비밀번호를 다시 입력"
          />
        </Field>

        <ErrorBox message={error} />
        <SubmitButton loading={loading} idle="비밀번호 변경하기" busy="변경 중..." />
      </form>
    )
  }

  // --- 1단계: 본인확인 ---
  return (
    <form onSubmit={handleVerify} noValidate className="space-y-4">
      <StepBadge current={1} />

      <Field label="아이디" error={showErr('username')}>
        <input
          className={inputCls(!!showErr('username'))}
          value={username}
          onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 20))}
          onBlur={() => setTouched((t) => ({ ...t, username: true }))}
          placeholder="아이디"
        />
      </Field>

      <Field label="이름(닉네임)" error={showErr('name')}>
        <input
          className={inputCls(!!showErr('name'))}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, name: true }))}
          placeholder="가입할 때 적은 이름"
        />
      </Field>

      <Field label="핸드폰 번호" error={showErr('phone')}>
        <input
          className={inputCls(!!showErr('phone'))}
          value={phone}
          onChange={(e) => setPhone(formatPhone(e.target.value))}
          onBlur={() => setTouched((t) => ({ ...t, phone: true }))}
          placeholder="010-0000-0000"
          inputMode="numeric"
        />
      </Field>

      <Field label="이메일" error={showErr('email')}>
        <input
          type="email"
          className={inputCls(!!showErr('email'))}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          placeholder="example@email.com"
        />
      </Field>

      <p className="text-[11px] leading-relaxed text-gm-muted2">
        저장된 비밀번호는 암호화되어 있어 원래 비밀번호를 알려드릴 수는 없어요. 대신 본인 확인 후
        새 비밀번호로 바꿔드립니다.
      </p>

      <ErrorBox message={error} />
      <SubmitButton loading={loading} idle="본인 확인" busy="확인 중..." />
    </form>
  )
}

/* =============================================================
   작은 공용 조각들
   ============================================================= */
const baseInput = 'w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-1'
function inputCls(hasError: boolean) {
  return `${baseInput} ${
    hasError
      ? 'border-red-400 focus:border-red-400 focus:ring-red-400'
      : 'border-gm-line focus:border-gm-leaf focus:ring-gm-leaf'
  }`
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full py-2 text-[13px] font-bold transition ${
        active ? 'bg-gm-green text-white shadow-sm' : 'text-gm-muted2 hover:text-gm-body'
      }`}
    >
      {children}
    </button>
  )
}

function StepBadge({ current }: { current: 1 | 2 }) {
  const steps = ['본인 확인', '새 비밀번호']
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const n = i + 1
        const on = n <= current
        return (
          <div key={label} className="flex items-center gap-2">
            <span
              className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold ${
                on ? 'bg-gm-green text-white' : 'bg-gm-cream2 text-gm-muted2'
              }`}
            >
              {n}
            </span>
            <span className={`text-[12px] font-semibold ${on ? 'text-gm-body' : 'text-gm-muted2'}`}>
              {label}
            </span>
            {n === 1 && <span className="mx-1 h-px w-4 bg-gm-line" />}
          </div>
        )
      })}
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-[13px] font-semibold text-gm-body">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function ErrorBox({ message }: { message: string }) {
  if (!message) return null
  return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{message}</p>
}

function SubmitButton({ loading, idle, busy }: { loading: boolean; idle: string; busy: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full rounded-full bg-gm-green py-3.5 text-[15px] font-bold text-white hover:opacity-90 disabled:opacity-50"
    >
      {loading ? busy : idle}
    </button>
  )
}

function ResultBox({
  title,
  note,
  value,
  children,
}: {
  title: string
  note: string
  value: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gm-cream2 px-4 py-6 text-center">
        <p className="text-[13px] text-gm-muted2">{title}</p>
        <p className="mt-2 break-all text-[20px] font-bold text-gm-green">{value}</p>
        <p className="mt-1.5 text-[11px] text-gm-muted2">{note}</p>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function formatDate(iso: string): string {
  // 서버(Node)와 브라우저의 표기가 갈리지 않도록 직접 조립합니다.
  const d = new Date(iso)
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
}

function LeafMark() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M12 21 C5 17 4 10 4 6 C9 6 12 9 12 14 C12 9 15 6 20 6 C20 10 19 17 12 21 Z" fill="#3a7a4e" />
    </svg>
  )
}
