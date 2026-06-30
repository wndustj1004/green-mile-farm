import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { LandingSection } from '@/app/admin/actions'
import LandingSections, { type Emissions } from '@/components/LandingSections'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('landing_sections')
    .select('id, sort_order, emoji, title, body, visible')
    .eq('visible', true)
    .order('sort_order', { ascending: true })
  const sections = (data ?? []) as LandingSection[]

  const { data: settings } = await supabase
    .from('settings')
    .select('car_emission, walk_emission, bike_emission, bus_emission, subway_emission')
    .eq('id', 1)
    .single()
  const emissions: Emissions = {
    car: Number(settings?.car_emission ?? 210),
    walk: Number(settings?.walk_emission ?? 0),
    bike: Number(settings?.bike_emission ?? 0),
    bus: Number(settings?.bus_emission ?? 27.7),
    subway: Number(settings?.subway_emission ?? 1.53),
  }

  return (
    <main className="flex min-h-screen flex-col bg-gm-cream">
      {/* 헤더 */}
      <header className="flex items-center border-b border-gm-line px-6 py-4">
        <div className="flex items-center gap-2">
          <LeafMark />
          <span className="text-[15px] font-bold tracking-tight text-gm-ink2">그린마일 팜</span>
        </div>
      </header>

      {/* 첫 화면(Hero) */}
      <section className="bg-gm-sage px-6 pb-11 pt-11 text-center">
        <div className="mx-auto max-w-md">
          <TomatoPot />
          <h1 className="mt-5 text-[28px] font-bold leading-[1.4] tracking-tight text-gm-ink sm:text-[32px]">
            걸을수록 자라는
            <br />
            <span className="bg-gradient-to-t from-[#cfe3b4] from-[38%] to-transparent to-[38%] px-0.5">
              나만의 친환경 텃밭
            </span>
          </h1>
          <p className="mt-4 text-sm leading-[1.75] text-gm-muted">
            걷기·자전거·대중교통으로 줄인 CO₂만큼
            <br />
            방울토마토가 자라요. 다 키우면 진짜 작물을!
          </p>

          {user ? (
            <Link
              href="/dashboard"
              className="mt-7 block rounded-full bg-gm-green py-3.5 text-[15px] font-bold text-white hover:opacity-90"
            >
              내 농장 보기 →
            </Link>
          ) : (
            <Link
              href="/login"
              className="mt-7 block rounded-full border-[1.5px] border-[#bcd0a8] py-3.5 text-[15px] font-bold text-gm-green hover:bg-gm-cream"
            >
              로그인
            </Link>
          )}

          {sections.length > 0 && (
            <div className="mt-6 flex flex-col items-center gap-1.5 text-gm-muted2">
              <span className="text-xs">처음이신가요? 아래로 내려 자세히 보기</span>
              <span className="animate-bounce text-lg">↓</span>
            </div>
          )}
        </div>
      </section>

      {/* 참여 방법 */}
      <section className="bg-gm-cream px-6 py-12 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="mb-7 text-center">
            <span className="text-[11px] font-bold tracking-[2px] text-gm-leaf">HOW IT WORKS</span>
            <h2 className="mt-2.5 text-[22px] font-bold tracking-tight text-gm-ink">이렇게 참여해요</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StepCard step="STEP 1" title="회원가입" desc="간단히 가입하고 시작">
              <SignupIll />
            </StepCard>
            <StepCard step="STEP 2" title="이동 인증" desc="걷기·자전거·대중교통">
              <WalkIll />
            </StepCard>
            <StepCard step="STEP 3" title="작물 성장" desc="줄인 CO₂만큼 쑥쑥">
              <SproutIll />
            </StepCard>
            <StepCard step="STEP 4" title="실물 보상" desc="진짜 작물 받기">
              <TomatoIll />
            </StepCard>
          </div>
        </div>
      </section>

      {/* 소개 섹션 4개 (관리자 편집 + 배출계수 연동) */}
      <LandingSections sections={sections} emissions={emissions} />

      {/* CTA */}
      <section className="bg-gm-cream px-6 py-9">
        <div className="mx-auto max-w-2xl rounded-3xl bg-gm-green px-6 py-9 text-center">
          <p className="text-[19px] font-bold leading-[1.5] tracking-tight text-white">
            오늘부터,
            <br />
            친환경 한 걸음을 시작해요
          </p>
          <p className="mt-2.5 text-[13px] leading-relaxed text-[#c2d6bf]">가입하고 첫 이동을 인증해 보세요</p>
          <Link
            href="/signup"
            className="mt-5 inline-block rounded-full bg-gm-cream px-8 py-3 text-sm font-bold text-gm-green hover:opacity-90"
          >
            회원가입하기
          </Link>
        </div>
      </section>

      <footer className="border-t border-gm-line bg-gm-cream py-6 text-center text-xs text-gm-muted2">
        🌿 그린마일 팜 · G.P.S
      </footer>
    </main>
  )
}

function StepCard({
  step,
  title,
  desc,
  children,
}: {
  step: string
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[18px] border border-gm-line bg-white px-4 py-5">
      {children}
      <p className="mt-3 text-[13px] font-semibold tracking-wider text-gm-muted2">{step}</p>
      <p className="mt-0.5 text-[15px] font-bold text-gm-ink2">{title}</p>
      <p className="mt-1.5 text-xs leading-snug text-gm-muted">{desc}</p>
    </div>
  )
}

function LeafMark() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M12 21 C5 17 4 10 4 6 C9 6 12 9 12 14 C12 9 15 6 20 6 C20 10 19 17 12 21 Z" fill="#3a7a4e" />
    </svg>
  )
}

function TomatoPot() {
  return (
    <svg viewBox="0 0 120 120" width="140" height="140" aria-hidden="true" className="mx-auto">
      <circle cx="60" cy="60" r="58" fill="#e2ebd6" />
      <ellipse cx="60" cy="103" rx="26" ry="4" fill="#cdd9bd" />
      <path d="M44 80 L76 80 L72 102 Q72 106 68 106 L52 106 Q48 106 48 102 Z" fill="#d49a72" />
      <rect x="41" y="74" width="38" height="9" rx="4.5" fill="#c5895f" />
      <rect x="58" y="40" width="4" height="36" rx="2" fill="#4f8d61" />
      <path d="M60 56 C50 54 42 46 40 36 C52 36 59 45 60 56 Z" fill="#62a373" />
      <path d="M60 52 C70 49 78 41 80 32 C68 32 61 41 60 52 Z" fill="#4f8d61" />
      <circle cx="51" cy="62" r="8.5" fill="#df6650" />
      <circle cx="69" cy="65" r="7" fill="#e9836a" />
      <path d="M51 53 q2 -4 5 -3 q-2 3 -5 3 Z" fill="#4f8d61" />
    </svg>
  )
}

function SignupIll() {
  return (
    <svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#eaf0e1" />
      <circle cx="24" cy="20" r="6.5" fill="#4f8d61" />
      <path d="M13 35 C13 28 18 26 24 26 C30 26 35 28 35 35 Z" fill="#4f8d61" />
      <circle cx="33" cy="15" r="6" fill="#df6650" />
      <path d="M33 12.5v5M30.5 15h5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function WalkIll() {
  return (
    <svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#eaf0e1" />
      <circle cx="25" cy="12" r="4" fill="#4f8d61" />
      <path d="M25 16 L22 26 L17 33" stroke="#4f8d61" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M25 19 L30 24 L29 32" stroke="#4f8d61" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M21 21 L31 23" stroke="#df6650" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function SproutIll() {
  return (
    <svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#eaf0e1" />
      <path d="M24 36 V20" stroke="#4f8d61" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 24 C20 24 15 22 14 16 C20 15 24 18 24 24 Z" fill="#62a373" />
      <path d="M24 21 C28 21 33 18 34 13 C28 12 24 16 24 21 Z" fill="#4f8d61" />
      <path d="M16 36 H32" stroke="#c5895f" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function TomatoIll() {
  return (
    <svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#eaf0e1" />
      <circle cx="24" cy="27" r="10" fill="#df6650" />
      <path d="M24 17 C24 13 27 11 30 11 C30 15 27 17 24 17 Z" fill="#4f8d61" />
      <path d="M24 17 C24 14 21 12 19 12 C19 15 21 17 24 17 Z" fill="#62a373" />
    </svg>
  )
}
