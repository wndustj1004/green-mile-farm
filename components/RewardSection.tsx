// 작물 보상 + 작물관리팀 케어로그 섹션 (제공된 디자인 반영, 정적 렌더)
// REAL FARM(재배 현장) 텍스트·사진은 관리자 편집 텍스트/이미지 사용.
import { supaImg } from '@/lib/img'

export default function RewardSection({ texts }: { texts: Record<string, string> }) {
  return (
    <section className="scroll-mt-20 bg-[#f4f2ec] px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#efeafd] px-3.5 py-2 text-[12px] font-bold tracking-[0.16em] text-[#6c4ce0]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#6c4ce0] ring-4 ring-[#6c4ce0]/15" />
          REWARD
        </span>
        <h2 className="mt-6 text-[32px] font-extrabold leading-[1.1] tracking-tight text-[#1a1b23] sm:text-[44px]">
          화면 속 텃밭이,
          <br />
          <span className="text-[#6c4ce0]">진짜 수확</span>이 됩니다
        </h2>
        <p className="mt-5 max-w-[50ch] text-[16px] leading-[1.65] text-[#5b5e6b] sm:text-[18px]">
          그린마일 팜의 보상은 그림이 아닙니다. G.P.S 임원진이 커피박 퇴비로 직접 키운 <b className="font-bold text-[#1a1b23]">살아있는 작물</b>이
          당신에게 도착합니다.
        </p>

        {/* Reward card */}
        <div
          className="mt-12 overflow-hidden rounded-[32px] p-9 text-white sm:p-14"
          style={{ background: 'linear-gradient(135deg,#5A3AD6 0%,#6C4CE0 50%,#8B5CF6 100%)' }}
        >
          <span className="inline-block rounded-full border border-white/25 bg-white/15 px-4 py-2 text-[12.5px] font-extrabold tracking-[0.2em]">
            REWARD
          </span>
          <h3 className="mt-5 text-[26px] font-extrabold leading-tight tracking-tight sm:text-[40px]">
            목표 5kg 달성 시,
            <br />
            진짜 작물을 받아요! 🎁
          </h3>
          <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.7] text-white/85 sm:text-[17px]">
            커피박(커피 찌꺼기) 퇴비로 기른 <b className="font-bold text-white">방울토마토와 스위트 바질</b>을 비닐 대신 여러 번 재사용
            가능한 <b className="font-bold text-white">밀랍랩</b>에 포장해 배송해 드립니다.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <RewardItem e="🍅" t="방울토마토" s="직접 재배한 열매" />
            <RewardItem e="🌿" t="스위트 바질" s="향긋한 허브" />
            <RewardItem e="🐝" t="밀랍랩" s="재사용 친환경 포장" />
            <RewardItem e="☕" t="커피박 퇴비" s="카페 폐기물의 순환" />
          </div>
        </div>

        {/* Real farm (관리자 편집) */}
        <div className="mt-20 text-center">
          <span className="inline-block rounded-full bg-[#e8f4ec] px-3.5 py-2 text-[12.5px] font-bold tracking-[0.14em] text-[#1e8a4c]">
            {texts['realfarm.tag']}
          </span>
          <h3 className="mt-4 whitespace-pre-line text-[24px] font-extrabold leading-tight tracking-tight text-[#1a1b23] sm:text-[36px]">
            {texts['realfarm.title']}
          </h3>
          <p className="mx-auto mt-3.5 max-w-[46ch] whitespace-pre-line text-[16px] leading-[1.7] text-[#5b5e6b]">
            {texts['realfarm.lead']}
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Photo url={texts['realfarm.photo1']} e="🌱" cap={texts['realfarm.caption1']} />
          <Photo url={texts['realfarm.photo2']} e="🌿" cap={texts['realfarm.caption2']} />
        </div>
        <p className="mt-5 text-center text-[13.5px] text-[#8e919c]">{texts['realfarm.note']}</p>

        {/* Care log */}
        <div className="mt-20 grid grid-cols-1 items-center gap-10 md:grid-cols-[1fr_360px]">
          <div>
            <span className="inline-block rounded-full bg-[#efeafd] px-3.5 py-2 text-[12.5px] font-bold tracking-[0.14em] text-[#6c4ce0]">
              CARE LOG · 작물관리팀
            </span>
            <h3 className="mt-4 text-[24px] font-extrabold leading-[1.22] tracking-tight text-[#1a1b23] sm:text-[36px]">
              이틀에 한 번,
              <br />
              점검 기록이 쌓입니다
            </h3>
            <p className="mt-4 max-w-[42ch] text-[16px] leading-[1.75] text-[#5b5e6b]">
              G.P.S 작물관리팀은 담당자를 정해 주기적으로 상태 확인·물주기·수확을 기록합니다. 여러분이 받게 될 작물은 이렇게
              관리되고 있어요.
            </p>
            <div className="mt-7 flex flex-col gap-3.5">
              <CarePoint ic="📋" title="정기 점검 로테이션" desc="담당자를 지정해 2일 간격으로 상태를 보고합니다" />
              <CarePoint ic="💧" title="화분별 맞춤 물주기" desc="흙 상태를 확인해 과습을 막고 필요한 만큼만" />
              <CarePoint
                ic="💡"
                title="식물생장 LED 조명 사용"
                desc="풀스펙트럼 파장을 이용해 태양광과 유사한 모든 파장을 제공하여 작물의 자연스러운 성장을 촉진시키며 기능성 성분 향상을 도모"
              />
              <CarePoint ic="🍅" title="수확 즉시 공유" desc="익은 열매는 바로 기록하고 신선한 환경에 안전하게 보관하여 보상 준비에 반영" />
            </div>
          </div>

          {/* Phone mockup */}
          <div className="mx-auto w-full max-w-[360px] rounded-[44px] bg-[#111318] p-3.5">
            <div className="flex h-[600px] flex-col overflow-hidden rounded-[32px] bg-[#1b1d24]">
              <div className="flex h-[34px] items-center justify-center">
                <div className="h-[22px] w-[110px] rounded-full bg-black" />
              </div>
              <div className="flex items-center gap-3 border-b border-white/10 px-[18px] pb-3.5 pt-2.5">
                <span className="text-[18px] text-[#8f94a3]">‹</span>
                <span className="text-[15.5px] font-bold text-white">작물관리팀</span>
                <span className="text-[13px] font-semibold text-[#8f94a3]">4</span>
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3.5 pb-5 pt-4.5">
                <DateChip>2026년 6월 29일 월요일</DateChip>
                <ChatMsg avatar="🌱" who="주**">
                  {`[점검] 6/29(월) 15:40 · 담당: 주**\n상태: 정상\n물주기 — 방울토마토 3화분 전체(습해서 조금만) / 바질 X\n특이사항: 수확 가능한 토마토 2개 열림\n다음 점검: 7/1(수) 설**`}
                </ChatMsg>
                <PicMsg avatar="🌱" e="🍅" />
                <DateChip>2026년 7월 1일 수요일</DateChip>
                <ChatMsg avatar="🌿" av="p2" who="설**">
                  {`[점검] 7/1(수) 18:25 · 담당: 설**\n상태: 정상\n물주기 — 방울토마토 3화분 전체(습해서 조금만) / 바질 O\n특이사항: 수확 가능한 토마토 여러 개 열림\n다음 점검: 7/3(금) 김**`}
                </ChatMsg>
                <PicMsg avatar="🌿" av="p2" e="🌿" />
                <DateChip>2026년 7월 3일 금요일</DateChip>
                <ChatMsg avatar="🍅" av="p3" who="김**">
                  {`[점검] 7/3(금) 17:40 · 담당: 김**\n상태: 정상\n물주기 — 방울토마토 3화분 전체 / 바질 X\n특이사항: 토마토 6개 수확 🍅`}
                </ChatMsg>
                <PicMsg avatar="🍅" av="p3" e="🤲🍅" />
                <ChatMsg avatar="🌱" who="주**">첫 수확 축하합니다 👏 챌린지 보상 준비 시작할게요!</ChatMsg>
              </div>
              <div className="flex items-center gap-2.5 border-t border-white/10 px-4 pb-5 pt-3">
                <div className="flex-1 rounded-full bg-[#2a2d37] px-4 py-2.5 text-[12.5px] text-[#6e7382]">메시지 입력</div>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-[#6c4ce0] text-[15px] text-white">↑</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function RewardItem({ e, t, s }: { e: string; t: string; s: string }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-3 py-6 text-center">
      <span className="block text-[34px]">{e}</span>
      <span className="mt-3 block text-[15px] font-bold">{t}</span>
      <span className="mt-1 block text-[12px] text-white/70">{s}</span>
    </div>
  )
}

function Photo({ url, e, cap }: { url?: string; e: string; cap: string }) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={supaImg(url, { width: 700, height: 525, resize: 'cover' })} alt="" className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-3 p-5 text-center text-[15px] font-bold text-[#1e8a4c]"
          style={{ background: 'linear-gradient(160deg,#EAF5EE,#DCEEE2)' }}
        >
          <span className="text-[44px]">{e}</span>
          재배 현장 사진
          <span className="text-[12px] font-medium text-[#8e919c]">추후 사진으로 교체됩니다</span>
        </div>
      )}
      {cap && (
        <div
          className="absolute inset-x-0 bottom-0 px-5 pb-4 pt-11 text-[13.5px] font-semibold text-white"
          style={{ background: 'linear-gradient(transparent,rgba(10,20,14,.72))' }}
        >
          {cap}
        </div>
      )}
    </div>
  )
}

function CarePoint({ ic, title, desc }: { ic: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3.5">
      <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-[#efeafd] text-[19px]">{ic}</div>
      <div>
        <b className="block text-[15px] font-bold tracking-tight text-[#1a1b23]">{title}</b>
        <span className="text-[13.5px] leading-relaxed text-[#5b5e6b]">{desc}</span>
      </div>
    </div>
  )
}

const AV: Record<string, string> = {
  p1: 'linear-gradient(135deg,#37B36B,#1E8A4C)',
  p2: 'linear-gradient(135deg,#8B5CF6,#6C4CE0)',
  p3: 'linear-gradient(135deg,#F0A24C,#DE7E2E)',
}

function Avatar({ emoji, av }: { emoji: string; av?: string }) {
  return (
    <div
      className="grid h-[34px] w-[34px] flex-shrink-0 place-items-center rounded-full text-[15px]"
      style={{ background: AV[av ?? 'p1'] }}
    >
      {emoji}
    </div>
  )
}

function DateChip({ children }: { children: string }) {
  return (
    <div className="self-center rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] text-[#9aa0af]">{children}</div>
  )
}

function ChatMsg({ avatar, av, who, children }: { avatar: string; av?: string; who: string; children: string }) {
  return (
    <div className="flex max-w-[88%] gap-2.5">
      <Avatar emoji={avatar} av={av} />
      <div className="flex flex-col gap-1.5">
        <span className="text-[11.5px] font-semibold text-[#9aa0af]">{who}</span>
        <div className="whitespace-pre-line rounded-[4px_16px_16px_16px] bg-[#2a2d37] px-3.5 py-3 text-[12.8px] leading-[1.65] text-[#e8eaf0]">
          {children}
        </div>
      </div>
    </div>
  )
}

function PicMsg({ avatar, av, e }: { avatar: string; av?: string; e: string }) {
  return (
    <div className="flex max-w-[88%] gap-2.5">
      <Avatar emoji={avatar} av={av} />
      <div
        className="relative grid aspect-[4/3] w-[170px] place-items-center overflow-hidden rounded-[14px]"
        style={{ background: 'linear-gradient(150deg,#24402F,#182B20)' }}
      >
        <span className="text-[34px]">{e}</span>
        <span className="absolute bottom-1.5 right-2 text-[9.5px] text-white/55">사진</span>
      </div>
    </div>
  )
}
