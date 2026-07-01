import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { LandingSection } from '@/app/admin/actions'
import { resolveSiteTexts } from '@/lib/siteText'
import LandingSections, { type Emissions } from '@/components/LandingSections'
import CertifyTutorial from '@/components/CertifyTutorial'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('landing_sections')
    .select('id, sort_order, emoji, title, body, visible, images')
    .eq('visible', true)
    .order('sort_order', { ascending: true })
  const sections = ((data ?? []).map((s) => ({ ...s, images: s.images ?? [] }))) as LandingSection[]

  const { data: textRows } = await supabase.from('site_texts').select('key, value')
  const T = resolveSiteTexts(textRows)

  const { data: settings } = await supabase
    .from('settings')
    .select('target_co2_kg, challenge_end, car_emission, walk_emission, bike_emission, bus_emission, subway_emission')
    .eq('id', 1)
    .single()
  const targetKg = Number(settings?.target_co2_kg ?? 5)
  const emissions: Emissions = {
    car: Number(settings?.car_emission ?? 210),
    walk: Number(settings?.walk_emission ?? 0),
    bike: Number(settings?.bike_emission ?? 0),
    bus: Number(settings?.bus_emission ?? 27.7),
    subway: Number(settings?.subway_emission ?? 1.53),
  }

  let dday: number | null = null
  if (settings?.challenge_end) {
    const end = new Date(settings.challenge_end as string)
    const today = new Date()
    end.setHours(0, 0, 0, 0)
    today.setHours(0, 0, 0, 0)
    const diff = Math.round((end.getTime() - today.getTime()) / 86400000)
    if (diff >= 0) dday = diff
  }

  const { data: statsRaw } = await supabase.rpc('challenge_stats')
  const stats = (statsRaw ?? {}) as { participants?: number; total_reduced_kg?: number; harvest_count?: number }
  const participants = Number(stats.participants ?? 0)
  const totalKg = Number(stats.total_reduced_kg ?? 0)
  const harvest = Number(stats.harvest_count ?? 0)

  return (
    <main className="flex min-h-screen flex-col bg-gm-cream">
      {/* 헤더 */}
      <header className="flex items-center justify-between border-b border-gm-line bg-white px-6 py-4">
        <div className="flex items-center gap-2">
          <LeafMark />
          <span className="text-[15px] font-bold tracking-tight text-gm-ink2">그린마일 팜</span>
        </div>
        {user ? (
          <Link href="/dashboard" className="text-[13px] font-semibold text-gm-green">
            내 농장 →
          </Link>
        ) : (
          <Link href="/login" className="text-[13px] font-semibold text-gm-green">
            로그인
          </Link>
        )}
      </header>

      {/* Hero (청록) */}
      <section className="bg-[#9ccabb] px-6 pb-8 pt-11 text-center">
        <span className="inline-block rounded-full bg-[#4f8d61] px-4 py-1.5 text-xs font-bold tracking-wider text-white">
          {T['hero.badge']}
        </span>
        <h1 className="mt-4 whitespace-pre-line text-[28px] font-extrabold leading-[1.35] tracking-tight text-[#1c2f28] sm:text-[32px]">
          {T['hero.title']}
        </h1>
        <div className="mt-4">
          <TomatoPot />
        </div>
      </section>

      {/* 미션 (초록) */}
      <section className="bg-[#5fae70] px-7 py-10 text-center">
        <p className="mx-auto max-w-md whitespace-pre-line text-[15px] leading-[1.8] text-white">
          {T['hero.mission']}
        </p>
        {!user && (
          <div className="mx-auto mt-6 flex max-w-xs flex-col gap-2.5">
            <Link href="/signup" className="rounded-full bg-[#161616] py-3.5 text-[15px] font-bold text-white hover:opacity-90">
              지금 시작하기
            </Link>
            <Link href="/login" className="rounded-full border border-white/70 py-3 text-sm font-bold text-white hover:bg-white/10">
              로그인
            </Link>
          </div>
        )}
      </section>

      {/* 참여 4단계 */}
      <section className="bg-gm-cream px-6 py-12 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="mb-7 text-center">
            <span className="text-[11px] font-bold tracking-[2px] text-gm-leaf">{T['steps.label']}</span>
            <h2 className="mt-2.5 text-[22px] font-bold tracking-tight text-gm-ink">{T['steps.title']}</h2>
          </div>
          <div className="flex flex-col gap-3">
            <StepRow n={1} title={T['steps.s1_title']} accent>{T['steps.s1_desc']}</StepRow>
            <StepRow n={2} title={T['steps.s2_title']}>{T['steps.s2_desc']}</StepRow>
            <StepRow n={3} title={T['steps.s3_title']}>{T['steps.s3_desc']}</StepRow>
            <StepRow n={4} title={T['steps.s4_title']}>{T['steps.s4_desc']}</StepRow>
          </div>
        </div>
      </section>

      {/* 이동 인증 튜토리얼 */}
      <section className="bg-gm-sage px-6 py-12 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <span className="text-[11px] font-bold tracking-[2px] text-gm-leaf">{T['guide.label']}</span>
            <h2 className="mt-2.5 text-[22px] font-bold tracking-tight text-gm-ink">{T['guide.title']}</h2>
          </div>
          <CertifyTutorial texts={T} />
        </div>
      </section>

      {/* 실시간 임팩트 */}
      <section className="bg-gm-cream px-6 py-12 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 text-center">
            <span className="text-[11px] font-bold tracking-[2px] text-gm-leaf">{T['impact.label']}</span>
            <h2 className="mt-2.5 text-[22px] font-bold tracking-tight text-gm-ink">{T['impact.title']}</h2>
            {dday !== null && (
              <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-gm-sage px-3.5 py-1.5">
                <span className="h-2 w-2 rounded-full bg-gm-leaf" />
                <span className="text-xs font-bold text-gm-green">챌린지 진행 중 · D-{dday}</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ImpactCard emoji="👥" value={`${participants}`} unit="명" label={T['impact.l_participants']} />
            <ImpactCard emoji="🌍" value={totalKg.toFixed(1)} unit="kg" label={T['impact.l_co2']} />
            <ImpactCard emoji="🍅" value={`${harvest}`} unit="명" label={T['impact.l_harvest']} />
            <ImpactCard emoji="🎯" value={`${targetKg}`} unit="kg" label={T['impact.l_target']} />
          </div>
          <Link
            href={user ? '/dashboard' : '/signup'}
            className="mt-6 block rounded-full bg-[#161616] py-3.5 text-center text-[15px] font-bold text-white hover:opacity-90"
          >
            {user ? '내 농장 보기' : T['impact.cta']}
          </Link>
        </div>
      </section>

      {/* 작물 보상 안내 */}
      <section className="bg-gm-cream px-5 py-8">
        <div className="mx-auto max-w-2xl rounded-3xl bg-[#4a5cc7] px-7 py-9">
          <span className="text-[11px] font-bold tracking-[2px] text-[#c9d1f5]">{T['reward.label']}</span>
          <h2 className="mt-2.5 whitespace-pre-line text-[23px] font-bold leading-snug tracking-tight text-white">
            {T['reward.title']}
          </h2>
          <ul className="mt-4 flex flex-col gap-2 text-sm leading-relaxed text-[#e5e9fb]">
            <li>{T['reward.bullet1']}</li>
            <li>{T['reward.bullet2']}</li>
          </ul>
          <div className="mt-6 grid grid-cols-4 gap-2">
            <RewardItem label={T['reward.item1']}><TomatoSvg /></RewardItem>
            <RewardItem label={T['reward.item2']}><BasilSvg /></RewardItem>
            <RewardItem label={T['reward.item3']}><BeeswaxSvg /></RewardItem>
            <RewardItem label={T['reward.item4']}><CoffeeSvg /></RewardItem>
          </div>
        </div>
      </section>

      {/* 소개 섹션 (관리자 편집 + 이미지 첨부 + 배출계수 연동 + 작물 사진 캐러셀) */}
      <LandingSections sections={sections} emissions={emissions} texts={T} />

      {/* CTA */}
      <section className="bg-gm-cream px-6 py-9">
        <div className="mx-auto max-w-2xl rounded-3xl bg-gm-green px-6 py-9 text-center">
          <p className="whitespace-pre-line text-[19px] font-bold leading-[1.5] tracking-tight text-white">
            {T['cta.title']}
          </p>
          <Link
            href={user ? '/dashboard' : '/signup'}
            className="mt-5 inline-block rounded-full bg-gm-cream px-8 py-3 text-sm font-bold text-gm-green hover:opacity-90"
          >
            {user ? '내 농장 보기' : T['cta.button']}
          </Link>
        </div>
      </section>

      <footer className="border-t border-gm-line bg-gm-cream py-6 text-center text-xs text-gm-muted2">
        {T['footer.text']}
      </footer>
    </main>
  )
}

function StepRow({ n, title, accent, children }: { n: number; title: string; accent?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex gap-3.5 rounded-2xl border border-gm-line bg-white p-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gm-green text-sm font-bold text-white">
        {n}
      </span>
      <div>
        <p className="text-[15px] font-bold text-gm-ink2">
          {title}
          {accent && <span className="ml-1.5 text-[11px] font-semibold text-gm-leaf">배송지 입력</span>}
        </p>
        <p className="mt-1.5 whitespace-pre-line text-[13px] leading-relaxed text-gm-muted">{children}</p>
      </div>
    </div>
  )
}

function ImpactCard({ emoji, value, unit, label }: { emoji: string; value: string; unit: string; label: string }) {
  return (
    <div className="rounded-2xl border border-gm-line bg-white px-5 py-5">
      <div className="text-2xl" aria-hidden>
        {emoji}
      </div>
      <div className="mt-2 text-[28px] font-extrabold tracking-tight text-gm-ink">
        {value}
        <span className="text-base font-bold">{unit}</span>
      </div>
      <p className="mt-1 text-xs text-gm-muted">{label}</p>
    </div>
  )
}

function RewardItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/95 px-1 py-3">
      {children}
      <span className="text-[10px] font-semibold text-gm-ink2">{label}</span>
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
    <svg viewBox="0 0 120 120" width="148" height="148" aria-hidden="true" className="mx-auto">
      <circle cx="60" cy="60" r="58" fill="#b6ddd0" />
      <ellipse cx="60" cy="103" rx="26" ry="4" fill="#a3ccbe" />
      <path d="M44 80 L76 80 L72 102 Q72 106 68 106 L52 106 Q48 106 48 102 Z" fill="#d49a72" />
      <rect x="41" y="74" width="38" height="9" rx="4.5" fill="#c5895f" />
      <rect x="58" y="40" width="4" height="36" rx="2" fill="#3f7d51" />
      <path d="M60 56 C50 54 42 46 40 36 C52 36 59 45 60 56 Z" fill="#54a06b" />
      <path d="M60 52 C70 49 78 41 80 32 C68 32 61 41 60 52 Z" fill="#3f7d51" />
      <circle cx="51" cy="62" r="8.5" fill="#df6650" />
      <circle cx="69" cy="65" r="7" fill="#e9836a" />
    </svg>
  )
}

function TomatoSvg() {
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
      <circle cx="20" cy="23" r="12" fill="#df6650" />
      <circle cx="16" cy="20" r="3" fill="#e9836a" />
      <path d="M20 11 C20 7 24 5 27 5 C27 9 24 11 20 11 Z" fill="#4f8d61" />
      <path d="M20 11 C20 7 16 5 13 5 C13 9 16 11 20 11 Z" fill="#62a373" />
    </svg>
  )
}

function BasilSvg() {
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
      <rect x="18.5" y="20" width="3" height="15" rx="1.5" fill="#3f7d51" />
      <path d="M20 24 C13 24 8 20 7 13 C15 12 20 17 20 24 Z" fill="#62a373" />
      <path d="M20 20 C27 20 32 15 33 9 C25 8 20 13 20 20 Z" fill="#4f8d61" />
      <path d="M20 30 C15 30 11 27 10 22 C17 21 20 25 20 30 Z" fill="#54a06b" />
    </svg>
  )
}

function BeeswaxSvg() {
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
      <rect x="7" y="9" width="26" height="22" rx="4" fill="#f2c94c" />
      <path d="M33 9 L25 17 L33 17 Z" fill="#e0b53f" />
      <circle cx="14" cy="16" r="1.6" fill="#e0b53f" />
      <circle cx="20" cy="20" r="1.6" fill="#e0b53f" />
      <circle cx="26" cy="24" r="1.6" fill="#e0b53f" />
      <circle cx="14" cy="24" r="1.6" fill="#e0b53f" />
    </svg>
  )
}

function CoffeeSvg() {
  return (
    <svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true">
      <path d="M9 20 L31 20 L28 33 Q27.6 34 26.5 34 L13.5 34 Q12.4 34 12 33 Z" fill="#7b4a2d" />
      <ellipse cx="20" cy="20" rx="11" ry="3.5" fill="#8a5636" />
      <path d="M20 20 C20 16 23 14 26 14 C26 18 23 20 20 20 Z" fill="#4f8d61" />
      <rect x="19" y="10" width="2.5" height="7" rx="1.2" fill="#3f7d51" />
    </svg>
  )
}
