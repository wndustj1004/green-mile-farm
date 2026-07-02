import type { LandingSection } from '@/app/admin/actions'
import CropCarousel from './CropCarousel'
import TransportSection from './TransportSection'
import ProjectSection from './ProjectSection'
import EmissionDataSection from './EmissionDataSection'
import Reveal from './Reveal'

// 메인페이지 아래로 스크롤하면 보이는 소개 섹션들.
// 텍스트(제목·본문)는 관리자 페이지(/admin/content)에서 수정 → DB에서 읽어옴.
// 매핑: 0 G.P.S / 1 공모 / 2 대중교통 정책·온실가스(통합) / 3 (통합됨, 미표시) / 4 작물 사진 캐러셀
export default function LandingSections({
  sections,
  texts,
}: {
  sections: LandingSection[]
  texts: Record<string, string>
}) {
  if (sections.length === 0) return null

  return (
    <>
      {sections.map((s, i) => {
        if (i === 0)
          return (
            <Reveal key={s.id}>
              <GpsIntro texts={texts} />
            </Reveal>
          )
        if (i === 1)
          return (
            <Reveal key={s.id}>
              <ProjectSection />
            </Reveal>
          )
        if (i === 2)
          return (
            <div key={s.id}>
              <Reveal>
                <TransportSection />
              </Reveal>
              <EmissionDataSection />
            </div>
          )
        if (i === 3) return null // 교통부문 온실가스 → 대중교통 섹션에 통합됨
        if (i === 4)
          return (
            <Reveal key={s.id}>
              <CarouselSection s={s} />
            </Reveal>
          )
        return (
          <Reveal key={s.id}>
            <StorySection s={s} />
          </Reveal>
        )
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

// 1) G.P.S 소개 (전용 디자인 — 문구는 관리자 편집 텍스트)
function GpsIntro({ texts }: { texts: Record<string, string> }) {
  return (
    <section className="scroll-mt-20 bg-[#f4f0e6] px-6 py-14 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#e8e1d1] px-3.5 py-1.5 text-xs font-semibold text-[#6b6656]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#a98a5e]" />
          {texts['gps.badge']}
        </span>
        <h2 className="mt-5 whitespace-pre-line font-serif text-[28px] font-bold leading-[1.35] tracking-tight text-[#2b2b26] sm:text-[34px]">
          {texts['gps.title']}
        </h2>
        <p className="mt-5 whitespace-pre-line text-[15px] leading-[1.85] text-[#6b6656]">{texts['gps.intro']}</p>

        <div className="mt-7 grid grid-cols-3 gap-2.5">
          <GpsStat value={texts['gps.stat1_value']} label={texts['gps.stat1_label']} />
          <GpsStat value={texts['gps.stat2_value']} label={texts['gps.stat2_label']} />
          <GpsStat value={texts['gps.stat3_value']} label={texts['gps.stat3_label']} small />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-[#2f3d2f] p-5">
            <p className="text-[11px] font-bold tracking-wider text-[#c9a978]">{texts['gps.act1_label']}</p>
            <h3 className="mt-2 text-[17px] font-bold text-white">{texts['gps.act1_title']}</h3>
            <p className="mt-2.5 whitespace-pre-line text-[13px] leading-relaxed text-[#cfd3c8]">{texts['gps.act1_body']}</p>
          </div>
          <div className="rounded-2xl border border-[#e0d9c8] bg-white p-5">
            <p className="text-[11px] font-bold tracking-wider text-[#b08b57]">{texts['gps.act2_label']}</p>
            <h3 className="mt-2 text-[17px] font-bold text-[#2b2b26]">{texts['gps.act2_title']}</h3>
            <p className="mt-2.5 whitespace-pre-line text-[13px] leading-relaxed text-[#6b6656]">{texts['gps.act2_body']}</p>
          </div>
        </div>

        <div className="my-7 border-t border-[#e0d9c8]" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="whitespace-pre-line text-[13px] leading-relaxed text-[#6b6656]">{texts['gps.bottom']}</p>
          <a
            href="https://www.instagram.com/gps_cnu"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-full bg-[#a98a5e] px-5 py-3 text-center text-sm font-bold text-white hover:opacity-90"
          >
            {texts['gps.insta_label']}
          </a>
        </div>
      </div>
    </section>
  )
}

function GpsStat({ value, label, small }: { value: string; label: string; small?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#e6dfce] bg-white px-3 py-4">
      <p className={`font-bold text-[#2b2b26] ${small ? 'text-[13px]' : 'text-2xl'}`}>{value}</p>
      <p className="mt-1 text-[11px] text-[#8a8474]">{label}</p>
    </div>
  )
}

// 1b) 스토리형 (기본 폴백)
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

