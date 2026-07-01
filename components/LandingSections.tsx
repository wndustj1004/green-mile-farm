import type { LandingSection } from '@/app/admin/actions'
import CropCarousel from './CropCarousel'

export type Emissions = {
  car: number
  walk: number
  bike: number
  bus: number
  subway: number
}

// 메인페이지 아래로 스크롤하면 보이는 소개 섹션들.
// 텍스트(제목·본문)는 관리자 페이지(/admin/content)에서 수정 → DB에서 읽어옴.
// 주제별로 형식이 다른 4개 풀섹션. (구조화 입력·실제 수치는 다음 단계에서 보강)
export default function LandingSections({
  sections,
  emissions,
}: {
  sections: LandingSection[]
  emissions: Emissions
}) {
  if (sections.length === 0) return null

  return (
    <>
      {sections.map((s, i) => {
        if (i === 0) return <StorySection key={s.id} s={s} />
        if (i === 1) return <ProjectSection key={s.id} s={s} />
        if (i === 2) return <PolicySection key={s.id} s={s} />
        if (i === 3) return <DataSection key={s.id} s={s} emissions={emissions} />
        if (i === 4) return <CarouselSection key={s.id} s={s} />
        return <StorySection key={s.id} s={s} />
      })}
    </>
  )
}

function Label({ children }: { children: string }) {
  return <span className="text-[11px] font-bold tracking-[2px] text-gm-leaf">{children}</span>
}

// 관리자가 섹션에 첨부한 이미지 표시
function SectionImages({ images }: { images: string[] }) {
  if (!images || images.length === 0) return null
  return (
    <div className={`mt-5 grid gap-2.5 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
      {images.map((url, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={url} alt="" className="h-44 w-full rounded-2xl border border-gm-line object-cover" />
      ))}
    </div>
  )
}

function PlantSvg() {
  return (
    <svg viewBox="0 0 120 110" width="140" height="128" aria-hidden="true">
      <ellipse cx="60" cy="100" rx="40" ry="6" fill="#e6ede0" />
      <rect x="58" y="46" width="4.5" height="54" rx="2" fill="#4f8d61" />
      <path d="M60 70 C47 68 37 59 34 47 C49 47 58 56 60 70 Z" fill="#62a373" />
      <path d="M60 62 C73 59 83 51 86 39 C71 39 62 49 60 62 Z" fill="#4f8d61" />
      <path d="M60 88 C50 87 42 81 40 73 C52 72 59 80 60 88 Z" fill="#5a9b6b" />
    </svg>
  )
}

// 1) 스토리형 — G.P.S 동아리 소개
function StorySection({ s }: { s: LandingSection }) {
  return (
    <section className="scroll-mt-20 bg-gm-cream px-7 py-12 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Label>ABOUT</Label>
        <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-gm-ink sm:text-3xl">{s.title}</h2>
        <div className="my-5 text-center">
          <PlantSvg />
        </div>
        <p className="whitespace-pre-line text-[15px] leading-[1.8] text-gm-body">{s.body}</p>
        <SectionImages images={s.images} />
      </div>
    </section>
  )
}

// 2) 강조 카드형 — 함께 그린 광주 공모사업
function ProjectSection({ s }: { s: LandingSection }) {
  const facts = [
    { k: '주최', v: '○○○' },
    { k: '운영 기간', v: '2026.7~8' },
    { k: '대상', v: '광주 시민' },
    { k: '목표', v: '탄소 감축' },
  ]
  return (
    <section className="scroll-mt-20 bg-gm-cream px-5 py-6 sm:py-8">
      <div className="mx-auto max-w-2xl rounded-3xl bg-gm-green px-7 py-9">
        <Label>PROJECT</Label>
        <h2 className="mt-2.5 text-2xl font-bold leading-snug tracking-tight text-white sm:text-[26px]">{s.title}</h2>
        <p className="mt-4 whitespace-pre-line text-sm leading-[1.8] text-[#d3e3cf]">{s.body}</p>
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {facts.map((f) => (
            <div key={f.k} className="rounded-2xl bg-[#3a6b47] p-3.5">
              <p className="text-[11px] text-[#a7c4a0]">{f.k}</p>
              <p className="mt-1 text-sm font-bold text-white">{f.v}</p>
            </div>
          ))}
        </div>
        <SectionImages images={s.images} />
        <p className="mt-3 text-[11px] text-[#9bb695]">※ 핵심 정보는 관리자가 채워 넣습니다</p>
      </div>
    </section>
  )
}

// 3) 통계+정책형 — 친환경 대중교통 정책·현황
function PolicySection({ s }: { s: LandingSection }) {
  return (
    <section className="scroll-mt-20 bg-gm-sage px-7 py-12 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Label>POLICY</Label>
        <h2 className="mt-2.5 text-2xl font-bold leading-snug tracking-tight text-gm-ink sm:text-3xl">{s.title}</h2>
        {s.body && <p className="mt-4 whitespace-pre-line text-[15px] leading-[1.8] text-gm-body">{s.body}</p>}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-white p-[18px] text-center">
            <div className="text-3xl font-extrabold tracking-tight text-gm-green">○○<span className="text-[15px]">개</span></div>
            <p className="mt-1.5 text-xs text-gm-muted">시내버스 노선</p>
          </div>
          <div className="rounded-2xl bg-white p-[18px] text-center">
            <div className="text-3xl font-extrabold tracking-tight text-gm-green">○○<span className="text-[15px]">%</span></div>
            <p className="mt-1.5 text-xs text-gm-muted">대중교통 분담률</p>
          </div>
        </div>
        <div className="mt-3.5 flex flex-col gap-2.5">
          <div className="rounded-xl bg-white px-4 py-3 text-[13px] leading-relaxed text-gm-body">🚍 버스·지하철 노선 확충 및 친환경 차량 도입</div>
          <div className="rounded-xl bg-white px-4 py-3 text-[13px] leading-relaxed text-gm-body">🚲 자전거 도로·공유 자전거 인프라 확대</div>
        </div>
        <SectionImages images={s.images} />
        <p className="mt-3 px-0.5 text-[11px] text-gm-muted2">※ 정확한 수치·정책은 관리자가 채워 넣습니다</p>
      </div>
    </section>
  )
}

// 5) 사진 캐러셀형 — G.P.S 작물 키우기 (관리자 업로드 사진)
function CarouselSection({ s }: { s: LandingSection }) {
  return (
    <section className="scroll-mt-20 bg-gm-cream px-7 py-12 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <Label>OUR GARDEN</Label>
        <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-gm-ink sm:text-3xl">{s.title}</h2>
        {s.body && (
          <p className="mt-3.5 whitespace-pre-line text-[15px] leading-[1.8] text-gm-body">{s.body}</p>
        )}
        <CropCarousel images={s.images} />
      </div>
    </section>
  )
}

// 4) 데이터 인포그래픽형 — 교통부문 온실가스 (배출계수 자동 연동)
function DataSection({ s, emissions }: { s: LandingSection; emissions: Emissions }) {
  const car = emissions.car > 0 ? emissions.car : 210
  const bars = [
    { label: '🚗 승용차', g: emissions.car, bad: true },
    { label: '🚌 버스', g: emissions.bus, bad: false },
    { label: '🚇 지하철', g: emissions.subway, bad: false },
    { label: '🚶 걷기·자전거', g: Math.max(emissions.walk, emissions.bike), bad: false },
  ]
  return (
    <section className="scroll-mt-20 bg-gm-cream px-5 py-8">
      <div className="mx-auto max-w-2xl rounded-3xl bg-[#26313a] px-7 py-9">
        <Label>DATA</Label>
        <h2 className="mt-2.5 text-2xl font-bold tracking-tight text-white sm:text-3xl">{s.title}</h2>
        <p className="mt-3.5 text-[15px] leading-[1.8] text-[#c3cbd2]">
          같은 거리를 이동해도 <b className="text-[#9fdcae]">어떤 수단</b>을 쓰느냐에 따라 배출량이 크게 달라집니다.
        </p>
        <div className="mt-5 rounded-2xl bg-white px-[18px] py-5">
          <p className="mb-4 text-[13px] font-bold text-[#3a4036]">1km 이동당 CO₂ 배출량</p>
          <div className="flex flex-col gap-3.5">
            {bars.map((b) => {
              const pct = Math.max(Math.round((b.g / car) * 100), b.g > 0 ? 2 : 1)
              return (
                <div key={b.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-semibold text-gm-body">{b.label}</span>
                    <span className={`font-bold ${b.bad ? 'text-[#c0392b]' : 'text-gm-green'}`}>{b.g} g</span>
                  </div>
                  <div className="h-3.5 overflow-hidden rounded-full bg-[#eee]">
                    <div
                      className={`h-full rounded-full ${b.bad ? 'bg-[#d9694f]' : 'bg-gm-leaf'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
          <p className="mt-3.5 text-[11px] text-gm-muted2">※ 그린마일 팜 배출계수 기준(임시값) · 관리자 설정에 연동</p>
        </div>
        <p className="mt-[18px] text-[15px] leading-[1.8] text-[#c3cbd2]">
          그래서 <b className="text-[#9fdcae]">이동수단을 바꾸는 것</b>만으로도 의미 있는 감축이 가능합니다.
        </p>
        <SectionImages images={s.images} />
      </div>
    </section>
  )
}
