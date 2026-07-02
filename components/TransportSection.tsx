// 친환경 대중교통 정책·현황 + 교통부문 온실가스 통합 섹션 (제공된 디자인 반영)
export default function TransportSection() {
  return (
    <section className="scroll-mt-20 bg-[#f4f2ec] px-6 py-16 sm:py-20">
      <div className="mx-auto max-w-3xl">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#e8f4ec] px-3.5 py-2 text-[12px] font-bold tracking-[0.16em] text-[#1e8a4c]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#37b36b] ring-4 ring-[#37b36b]/20" />
          POLICY · 광주광역시
        </span>
        <h2 className="mt-6 text-[32px] font-extrabold leading-[1.1] tracking-tight text-[#14201a] sm:text-[44px]">
          매일의 이동이
          <br />
          <span className="text-[#1e8a4c]">도시의 탄소</span>를 바꿉니다
        </h2>
        <p className="mt-6 text-[16px] leading-[1.6] text-[#5a6660] sm:text-[18px]">
          광주광역시는 2024년 6월 <b className="font-bold text-[#14201a]">‘대·자·보(대중교통·자전거·보행) 도시’</b> 전환을
          선언했습니다. 승용차 대신 대중교통·자전거·걷기를 선택하는 시민 한 사람의 습관이, 도시 전체의 온실가스를 줄이는
          가장 확실한 방법입니다.
        </p>

        {/* Hero stat */}
        <div
          className="mt-10 overflow-hidden rounded-[28px] p-8 text-white sm:p-12"
          style={{ background: 'linear-gradient(135deg,#0F6B39 0%,#14804A 55%,#1E9A57 100%)' }}
        >
          <p className="text-[14px] font-semibold text-white/80">광주 온실가스 배출 중 수송 부문 비중</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-[64px] font-black leading-none tracking-tight text-white sm:text-[120px]">32.3</span>
            <span className="text-[32px] font-extrabold text-[#bfefd1] sm:text-[48px]">%</span>
          </div>
          <p className="mt-3 text-[19px] font-semibold leading-snug tracking-tight sm:text-[24px]">
            광주 탄소배출의 3분의 1은, 우리가 매일 하는 ‘이동’에서 나옵니다.
          </p>
          <p className="mt-4 text-[14px] leading-relaxed text-white/70">
            최근 10년간 건물·수송 부문이 전체 배출의 70% 이상을 차지하며, 그중 수송 부문이 32.3%. 대부분은 도로 위
            자동차에서 발생합니다.
          </p>
        </div>

        {/* Metrics */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <Metric ic="🚍" big="101" unit="개" lbl="시내버스 노선" note="운행 1,044대 · 준공영제" />
          <Metric ic="📊" big="22.9" unit="%" lbl="대중교통 분담률" note="2024년 · 목표 42.6%(’27)" />
          <Metric ic="🚲" big="669.4" unit="km" lbl="자전거도로" note="539개소 · 2024.12" />
          <Metric ic="🎫" big="90" unit="만명" lbl="G-패스 월평균 이용" note="2025.8 · 전년比 +2.4%" />
        </div>

        {/* Roadmap */}
        <div className="mt-5 rounded-[22px] border border-[#14201a]/[0.08] bg-white p-6 shadow-sm sm:p-9">
          <span className="rounded-full bg-[#e8f4ec] px-3 py-1.5 text-[12px] font-bold text-[#1e8a4c]">TARGET ROADMAP</span>
          <h3 className="mt-3.5 text-[20px] font-extrabold tracking-tight text-[#14201a] sm:text-[24px]">
            대중교통 분담률, 이렇게 끌어올립니다
          </h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5a6660]">
            도시철도 2호선 개통과 G-패스 효과가 겹치면 분담률은 빠르게 상승합니다.
          </p>
          <div className="relative mt-8 h-3.5 overflow-hidden rounded-full bg-[#edeae1]">
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: '85.2%', background: 'repeating-linear-gradient(90deg,rgba(30,138,76,.22) 0 6px,transparent 6px 12px)' }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{ width: '45.8%', background: 'linear-gradient(90deg,#37B36B,#1E8A4C)' }}
            />
          </div>
          <div className="mt-4 flex justify-between gap-3 text-center">
            <RoadMark v="22.9%" k="현재" y="2024" color="#1e8a4c" />
            <RoadMark v="42.6%" k="1차 목표" y="2026–27" color="#c98a2b" />
            <RoadMark v="50%" k="장기 목표" y="2030년대" color="#8a938d" />
          </div>
        </div>

        {/* 대·자·보 CITY */}
        <div className="mt-16 mb-1">
          <span className="rounded-full bg-[#e8f4ec] px-3 py-1.5 text-[12px] font-bold text-[#1e8a4c]">대·자·보 CITY</span>
          <h3 className="mt-3.5 text-[24px] font-extrabold tracking-tight text-[#14201a] sm:text-[30px]">
            광주가 지금 추진 중인 4가지
          </h3>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Policy n="01" ic="🚈" title="도시철도 2호선" chip="1단계 개통 준비 중">
            1단계 개통에 맞춰 시내버스 노선을 전면 개편합니다. 지하철·버스 환승 동선을 재설계해 대중교통 접근성을
            높입니다.
          </Policy>
          <Policy n="02" ic="🎫" title="광주 G-패스" chip="월평균 90만 명 이용">
            정부 K-패스에 시비를 더해 교통비를 최대 50~64% 환급. 어린이 무료, 청소년 최대 50%, 청년 기준을 만 39세까지
            확대했습니다.
          </Policy>
          <Policy n="03" ic="🚌" title="BRT 간선급행버스" chip="8.67km 구간">
            백운광장~농성역~광천사거리~광주공고를 잇는 8.67km 구간을 추진 중. 정시성 높은 급행 버스로 승용차 수요를
            흡수합니다.
          </Policy>
          <Policy n="04" ic="🚶" title="보행 중심 도로 재편" chip="차 없는 거리 확대">
            ‘청춘 빛포차 광장’ 등 차 없는 광장을 확대하고, 금남로·충장로에서 정기적인 ‘차 없는 거리’를 운영합니다.
          </Policy>
        </div>

        {/* CO₂ per 1km */}
        <div className="mt-5 rounded-[22px] border border-[#14201a]/[0.08] bg-white p-6 shadow-sm sm:p-9">
          <span className="rounded-full bg-[#e8f4ec] px-3 py-1.5 text-[12px] font-bold text-[#1e8a4c]">CO₂ PER 1km</span>
          <h3 className="mt-3.5 text-[20px] font-extrabold tracking-tight text-[#14201a] sm:text-[24px]">같은 거리, 다른 배출</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[#5a6660]">
            1km를 이동할 때 수단에 따라 배출량이 최대 7배 넘게 차이납니다.
          </p>
          <div className="mt-5">
            <Co2Row e="🚗" name="승용차" pct={100} val="211.1" grad="linear-gradient(90deg,#E7897C,#D9584A)" />
            <Co2Row e="🚌" name="버스" pct={13.8} val="29.1" grad="linear-gradient(90deg,#7FC79C,#3E9E67)" />
            <Co2Row e="🚇" name="지하철" pct={13.6} val="28.7" grad="linear-gradient(90deg,#8CCBA6,#4AA974)" />
            <Co2Row e="🚶" name="도보·자전거" pct={2.5} val="0" grad="linear-gradient(90deg,#37B36B,#1E8A4C)" />
          </div>
          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-[#e8f4ec] px-5 py-4 text-[15px] font-semibold text-[#0f6b39]">
            <span className="text-[22px]">🌱</span>
            <span>
              승용차를 대중교통으로 바꾸기만 해도 배출량이 <b className="font-black">약 1/7</b>로 줄어듭니다.
            </span>
          </div>
        </div>

        <p className="mt-16 border-t border-[#14201a]/[0.08] pt-6 text-[12.5px] leading-relaxed text-[#8a938d]">
          <b className="font-bold text-[#5a6660]">출처</b> · 광주광역시 「대·자·보 도시」 전환 정책(2024.6) 및 친환경
          대중교통 현황 자료. 시내버스 101개 노선(1,044대)·대중교통 분담률 22.9%(2024)·자전거도로 669.4km/539개소(2024.12)·G-패스
          월평균 90만 명(2025.8)·1km당 CO₂ 배출계수(승용차 211.1g/버스 29.1g/지하철 28.7g/도보·자전거 0g)·분담률 목표
          42.6%(2026–27)~50%(2030년대) 기준.
        </p>
      </div>
    </section>
  )
}

function Metric({ ic, big, unit, lbl, note }: { ic: string; big: string; unit: string; lbl: string; note: string }) {
  return (
    <div className="rounded-[22px] border border-[#14201a]/[0.08] bg-white p-6 shadow-sm">
      <div className="mb-4 text-[22px]">{ic}</div>
      <div className="text-[30px] font-extrabold leading-none tracking-tight text-[#0f6b39] sm:text-[38px]">
        {big}
        <small className="ml-0.5 text-[0.5em] font-bold text-[#1e8a4c]">{unit}</small>
      </div>
      <div className="mt-2.5 text-[15px] font-semibold text-[#14201a]">{lbl}</div>
      <div className="mt-1 text-[12.5px] text-[#8a938d]">{note}</div>
    </div>
  )
}

function RoadMark({ v, k, y, color }: { v: string; k: string; y: string; color: string }) {
  return (
    <div className="flex-1">
      <div className="text-[22px] font-extrabold leading-none tracking-tight sm:text-[28px]" style={{ color }}>
        {v}
      </div>
      <div className="mt-1.5 text-[12.5px] font-semibold text-[#5a6660]">{k}</div>
      <div className="mt-0.5 text-[11.5px] text-[#8a938d]">{y}</div>
    </div>
  )
}

function Policy({
  n,
  ic,
  title,
  chip,
  children,
}: {
  n: string
  ic: string
  title: string
  chip: string
  children: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden rounded-[22px] border border-[#14201a]/[0.08] bg-white p-8 shadow-sm">
      <span className="absolute right-6 top-5 text-[52px] font-black leading-none tracking-tight text-[#e8f4ec]">{n}</span>
      <div className="mb-5 grid h-13 w-13 place-items-center rounded-2xl bg-[#e8f4ec] text-2xl" style={{ height: 52, width: 52 }}>
        {ic}
      </div>
      <h4 className="relative text-[19px] font-extrabold tracking-tight text-[#14201a]">{title}</h4>
      <p className="relative mt-2.5 text-[14.5px] leading-relaxed text-[#5a6660]">{children}</p>
      <span className="relative mt-4 inline-block rounded-full bg-[#e8f4ec] px-3 py-1.5 text-[12.5px] font-bold text-[#0f6b39]">
        {chip}
      </span>
    </div>
  )
}

function Co2Row({ e, name, pct, val, grad }: { e: string; name: string; pct: number; val: string; grad: string }) {
  return (
    <div className="flex items-center gap-4 border-t border-[#14201a]/[0.08] py-4 first:border-t-0">
      <div className="flex w-[104px] flex-shrink-0 items-center gap-2 text-[14px] font-semibold text-[#14201a] sm:w-[150px] sm:text-[15.5px]">
        <span className="text-[20px]">{e}</span>
        {name}
      </div>
      <div className="relative h-9 flex-1 overflow-hidden rounded-xl bg-[#f1eee6]">
        <div className="absolute inset-y-0 left-0 rounded-xl" style={{ width: `${pct}%`, background: grad }} />
      </div>
      <div className="w-[68px] flex-shrink-0 text-right text-[16px] font-extrabold tracking-tight text-[#14201a] sm:w-[96px]">
        {val}
        <small className="text-[12px] font-semibold text-[#8a938d]">g</small>
      </div>
    </div>
  )
}
