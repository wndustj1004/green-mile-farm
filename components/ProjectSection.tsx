// 함께 그린(Green) 광주 — 공모사업 안내 섹션 (제공된 디자인·내용 반영, 목표 수치 영역 제외)
const PANEL_BG = `radial-gradient(900px 520px at 85% -10%,rgba(143,227,176,.16),transparent 55%),radial-gradient(700px 600px at -10% 110%,rgba(216,242,110,.10),transparent 55%),linear-gradient(158deg,#0E2A1B 0%,#123A24 48%,#175231 100%)`

export default function ProjectSection() {
  return (
    <section className="scroll-mt-20 bg-[#f4f2ec] px-5 py-16 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <div className="overflow-hidden rounded-[28px] px-6 py-11 text-[#eaf6ee] sm:rounded-[40px] sm:px-14 sm:py-16" style={{ background: PANEL_BG }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(143,227,176,.25)] bg-[rgba(143,227,176,.1)] px-4 py-2 text-[12.5px] font-bold tracking-[0.2em] text-[#8fe3b0]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#d8f26e]" />
            PROJECT · 2026 공모사업
          </span>
          <h2 className="mt-7 text-[34px] font-extrabold leading-[1.12] tracking-tight sm:text-[56px]">
            함께{' '}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(92deg,#8FE3B0 0%,#D8F26E 100%)' }}
            >
              그린(Green)
            </span>{' '}
            광주
          </h2>
          <p className="mt-4 text-[16px] font-semibold tracking-tight text-[#c9f2da] sm:text-[21px]">
            버려진 자원에 새 숨결을, 지역 사회에 따뜻한 나눔을
          </p>
          <p className="mt-5 max-w-[62ch] text-[14.5px] leading-[1.8] text-[rgba(234,246,238,.72)] sm:text-[17px]">
            그린마일 팜 챌린지는 (사)광주광역시자원봉사센터 「2026 프로젝트형 자원봉사 프로그램 공모사업」으로 진행되는 시민 참여
            프로젝트입니다. 시민 한 사람 한 사람의 친환경 이동이 도시 전체의 탄소 감축으로 이어지도록 설계되었습니다.
          </p>

          {/* 메타 */}
          <div className="mt-11 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-[rgba(255,255,255,.13)] bg-[rgba(255,255,255,.13)] md:grid-cols-4">
            <Meta k="주최 · 주관" v={<>(사)광주광역시<br />자원봉사센터</>} s="프로젝트형 자원봉사 프로그램" />
            <Meta k="수행 단체" v={<>G.P.S</>} s="전남대학교 환경에너지공학과 환경봉사동아리" />
            <Meta k="추진 기간" v={<>2026. 4. 27<br />— 10. 30</>} s="챌린지 운영 6월~ (여름 시즌)" />
            <Meta k="대상 · 목표" v={<>광주 시민 누구나</>} s="친환경 이동 실천 · CO₂ 감축" />
          </div>

          {/* 방향 2 */}
          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DirCard
              no="DIRECTION 01"
              title={<>버려지던 자원이,<br />다시 지역으로 돌아옵니다</>}
              chips={['폐현수막 · 커피찌꺼기', '업사이클링', '지역사회 환원']}
            >
              소각·매립되던 폐현수막과 커피찌꺼기를 업사이클링해 에코백·돗자리·퇴비로 재탄생시키고, 그 가치를 시민과 아동이 직접
              체감하는 자원순환의 선순환 구조를 만듭니다.
            </DirCard>
            <DirCard
              no="DIRECTION 02"
              title={<>일상의 실천이, 눈에 보이는<br />탄소 감축이 됩니다</>}
              chips={['친환경 이동 인증', 'CO₂ 감축 가시화', '실물 작물 보상']}
            >
              걷기·자전거·대중교통이라는 일상적 실천이 실제 탄소 감축으로 이어짐을 눈으로 확인하고 실물 작물로 보상받는 참여형 환경
              플랫폼 — 그것이 그린마일 팜 챌린지입니다.
            </DirCard>
          </div>

          {/* 4 프로그램 */}
          <div className="mt-20 text-center">
            <span className="text-[12px] font-bold tracking-[0.18em] text-[#8fe3b0]">4 PROGRAMS</span>
            <h3 className="mt-3.5 text-[24px] font-extrabold tracking-tight sm:text-[36px]">하나의 비전, 네 가지 실천</h3>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <Prog e="🚴" title={<>자전거도로 플로깅<br />&amp; 대자보 캠페인</>}>
              영산강·광주천·북구 자전거 겸용 도로 일대를 정화하고, 친환경 교통 전환을 촉구하는 대자보 도보 캠페인을 병행합니다.
            </Prog>
            <Prog e="🌱" title={<>그린마일 팜<br />챌린지</>} hot>
              친환경 이동 인증 시 CO₂ 감축량만큼 온라인 작물이 성장하고, 커피찌꺼기 퇴비로 직접 재배한 실물 작물을 밀랍랩에 포장해
              전달합니다.
            </Prog>
            <Prog e="☕" title={<>커피찌꺼기<br />업사이클링 교육</>}>
              지역아동센터와 연계해 커피찌꺼기의 자원 가치를 교육하고, 커피박 키트로 자원순환을 직접 체험하는 활동을 진행합니다.
            </Prog>
            <Prog e="♻️" title={<>폐현수막<br />업사이클링</>}>
              폐현수막을 수거해 에코백·돗자리로 제작하고, 대여·SNS 인증 캠페인으로 자원순환 인식을 확산합니다.
            </Prog>
          </div>
        </div>
      </div>
    </section>
  )
}

function Meta({ k, v, s }: { k: string; v: React.ReactNode; s: string }) {
  return (
    <div className="bg-[rgba(14,42,27,.55)] px-6 py-5">
      <div className="text-[11.5px] font-bold uppercase tracking-[0.14em] text-[rgba(234,246,238,.45)]">{k}</div>
      <div className="mt-2 text-[15.5px] font-bold leading-snug text-[#eaf6ee]">
        {v}
        <span className="mt-1 block text-[12px] font-medium text-[rgba(234,246,238,.72)]">{s}</span>
      </div>
    </div>
  )
}

function DirCard({
  no,
  title,
  chips,
  children,
}: {
  no: string
  title: React.ReactNode
  chips: string[]
  children: React.ReactNode
}) {
  return (
    <div className="rounded-[26px] border border-[rgba(255,255,255,.13)] bg-[rgba(255,255,255,.07)] p-7 sm:p-8">
      <span className="text-[13px] font-extrabold tracking-[0.16em] text-[#d8f26e]">{no}</span>
      <h4 className="mt-3.5 text-[19px] font-extrabold leading-snug tracking-tight sm:text-[24px]">{title}</h4>
      <p className="mt-3 text-[14.5px] leading-[1.75] text-[rgba(234,246,238,.72)]">{children}</p>
      <div className="mt-[18px] flex flex-wrap items-center gap-1.5">
        {chips.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="rounded-full border border-[rgba(143,227,176,.2)] bg-[rgba(143,227,176,.1)] px-3 py-1.5 text-[12px] font-semibold text-[#c9f2da]">
              {c}
            </span>
            {i < chips.length - 1 && <span className="text-[12px] text-[rgba(234,246,238,.45)]">→</span>}
          </span>
        ))}
      </div>
    </div>
  )
}

function Prog({ e, title, hot, children }: { e: string; title: React.ReactNode; hot?: boolean; children: React.ReactNode }) {
  return (
    <div
      className={`relative rounded-[22px] border p-6 ${
        hot
          ? 'border-[rgba(216,242,110,.4)]'
          : 'border-[rgba(255,255,255,.13)] bg-[rgba(255,255,255,.07)]'
      }`}
      style={hot ? { background: 'linear-gradient(160deg,rgba(216,242,110,.14),rgba(143,227,176,.08))' } : undefined}
    >
      {hot && (
        <span className="absolute right-3.5 top-3.5 rounded-full bg-[#d8f26e] px-2.5 py-1 text-[10px] font-extrabold tracking-[0.1em] text-[#12301f]">
          YOU ARE HERE
        </span>
      )}
      <span className="text-[30px]">{e}</span>
      <h5 className="mt-3.5 text-[16px] font-extrabold leading-snug tracking-tight text-[#eaf6ee]">{title}</h5>
      <p className="mt-2.5 text-[12.8px] leading-[1.7] text-[rgba(234,246,238,.72)]">{children}</p>
    </div>
  )
}
