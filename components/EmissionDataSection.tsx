'use client'

import { useEffect, useRef } from 'react'

// 광주 교통 온실가스 DATA 섹션 (제공된 디자인·내용·애니메이션 반영, INSIGHT CTA 버튼 제외)
export default function EmissionDataSection() {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return

    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { threshold: 0.15 }
    )
    el.querySelectorAll('.reveal').forEach((n) => io.observe(n))

    const barIo = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (!e.isIntersecting) return
        e.target.querySelectorAll<HTMLElement>('.fill').forEach((f, i) => {
          setTimeout(() => { f.style.width = (f.dataset.w || '0') + '%' }, i * 140)
        })
        barIo.unobserve(e.target)
      }),
      { threshold: 0.35 }
    )
    el.querySelectorAll('.bars').forEach((n) => barIo.observe(n))

    const cntIo = new IntersectionObserver(
      (es) => es.forEach((e) => {
        if (!e.isIntersecting) return
        const node = e.target as HTMLElement
        const to = parseFloat(node.dataset.to || '0')
        const dec = Number(node.dataset.dec || 0)
        const t0 = performance.now()
        const tick = (t: number) => {
          const p = Math.min((t - t0) / 1500, 1)
          const ease = 1 - Math.pow(1 - p, 3)
          node.textContent = (to * ease).toLocaleString('ko-KR', { minimumFractionDigits: dec, maximumFractionDigits: dec })
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        cntIo.unobserve(node)
      }),
      { threshold: 0.6 }
    )
    el.querySelectorAll('.cnt').forEach((n) => cntIo.observe(n))

    return () => { io.disconnect(); barIo.disconnect(); cntIo.disconnect() }
  }, [])

  return (
    <div ref={root} className="emis bg-[#f4f2ec]">
      <style jsx>{`
        .emis{--bg:#F4F2EC;--deep1:#0E2A1B;--deep2:#123A24;--deep3:#175231;--green:#1B7A44;--mint:#8FE3B0;--mint-soft:#C9F2DA;--lime:#D8F26E;--ink:#152119;--ink-soft:rgba(21,33,25,.66);--ink-faint:rgba(21,33,25,.42);--card:#FFFFFF;--line:rgba(21,33,25,.09);--radius:24px;color:var(--ink)}
        .section{max-width:1180px;margin:0 auto;padding:40px 20px 120px}
        .reveal{opacity:0;transform:translateY(32px);filter:blur(6px) saturate(.7);transition:opacity 1s cubic-bezier(.16,1,.3,1),transform 1s cubic-bezier(.16,1,.3,1),filter 1s cubic-bezier(.16,1,.3,1)}
        .reveal.in{opacity:1;transform:none;filter:blur(0) saturate(1)}
        .d1{transition-delay:.08s}.d2{transition-delay:.16s}
        .eyebrow{display:inline-flex;align-items:center;gap:9px;font-size:12.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--green);background:rgba(27,122,68,.08);border:1px solid rgba(27,122,68,.2);padding:9px 16px;border-radius:100px}
        .eyebrow .dot{width:6px;height:6px;border-radius:50%;background:var(--green);animation:pulse 2.4s ease-in-out infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .title{margin-top:26px;font-size:clamp(30px,5vw,56px);font-weight:800;letter-spacing:-.03em;line-height:1.14}
        .title .hl{background:linear-gradient(92deg,var(--green),#2FA05C);-webkit-background-clip:text;background-clip:text;color:transparent}
        .lead{margin-top:20px;max-width:60ch;font-size:clamp(14.5px,1.7vw,17.5px);color:var(--ink-soft);letter-spacing:-.01em;line-height:1.8}
        .hero-stat{margin-top:40px;border-radius:32px;overflow:hidden;position:relative;color:#EAF6EE;background:radial-gradient(760px 420px at 88% -10%,rgba(143,227,176,.18),transparent 55%),linear-gradient(155deg,var(--deep1),var(--deep2) 55%,var(--deep3));padding:clamp(34px,5vw,64px) clamp(24px,5vw,64px);box-shadow:0 34px 80px -38px rgba(14,42,27,.5)}
        .hero-stat .cap{font-size:13px;font-weight:700;letter-spacing:.18em;color:var(--mint)}
        .hero-stat .big{margin-top:12px;font-size:clamp(56px,11vw,132px);font-weight:800;letter-spacing:-.05em;line-height:1;background:linear-gradient(180deg,#fff 25%,var(--mint));-webkit-background-clip:text;background-clip:text;color:transparent}
        .hero-stat .big .unit{font-size:.42em;font-weight:700}
        .hero-stat .desc{margin-top:18px;font-size:clamp(15px,1.9vw,19px);font-weight:600;letter-spacing:-.02em;line-height:1.65;max-width:46ch;color:rgba(234,246,238,.88)}
        .hero-stat .desc b{color:var(--lime)}
        .hero-stat .src{margin-top:16px;font-size:11.5px;color:rgba(234,246,238,.4)}
        .grid2{margin-top:18px;display:grid;grid-template-columns:1.25fr 1fr;gap:18px}
        .card{background:var(--card);border:1px solid var(--line);border-radius:var(--radius);padding:30px 26px;box-shadow:0 18px 44px -28px rgba(21,33,25,.18)}
        .card .tag{font-size:11.5px;font-weight:800;letter-spacing:.16em;color:var(--green)}
        .card h3{margin-top:12px;font-size:clamp(19px,2.3vw,24px);font-weight:800;letter-spacing:-.025em;line-height:1.3}
        .card .sub{margin-top:8px;font-size:13.5px;color:var(--ink-soft);line-height:1.7}
        .bars{margin-top:28px;display:flex;flex-direction:column;gap:18px}
        .bar-row .top{display:flex;justify-content:space-between;align-items:baseline;font-size:13.5px;font-weight:700;letter-spacing:-.01em}
        .bar-row .top .val{font-size:15px;font-weight:800;letter-spacing:-.02em}
        .bar-row .top .val small{font-size:11px;font-weight:600;color:var(--ink-faint)}
        .bar-row .track{margin-top:8px;height:14px;border-radius:100px;background:rgba(21,33,25,.06);overflow:hidden}
        .bar-row .fill{height:100%;width:0;border-radius:100px;transition:width 1.5s cubic-bezier(.16,1,.3,1)}
        .f-car{background:linear-gradient(90deg,#E4572E,#F2854B)}
        .f-truck{background:linear-gradient(90deg,#C98A2E,#E5B45A)}
        .f-van{background:linear-gradient(90deg,#2FA05C,var(--mint))}
        .f-etc{background:linear-gradient(90deg,#5B8C6E,#9DC3AA)}
        .f-diesel{background:linear-gradient(90deg,#3A3F44,#6B7278)}
        .f-gas{background:linear-gradient(90deg,#E4572E,#F2854B)}
        .f-lpg{background:linear-gradient(90deg,#2FA05C,var(--mint))}
        .bar-note{margin-top:22px;font-size:13px;line-height:1.75;color:var(--ink-soft);background:rgba(27,122,68,.06);border-left:3px solid var(--green);padding:14px 16px;border-radius:0 12px 12px 0}
        .bar-note b{color:var(--green)}
        .cmp-grid{margin-top:18px;display:grid;grid-template-columns:1fr 1fr;gap:18px}
        .cmp{display:flex;flex-direction:column;gap:14px;margin-top:26px}
        .cmp-item{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:16px 18px;border:1px solid var(--line);border-radius:16px;background:rgba(244,242,236,.5)}
        .cmp-item .e{font-size:24px}
        .cmp-item .name{font-size:14px;font-weight:800;letter-spacing:-.01em}
        .cmp-item .name small{display:block;margin-top:3px;font-size:11.5px;font-weight:500;color:var(--ink-faint)}
        .cmp-item .delta{text-align:right;font-size:15px;font-weight:800;letter-spacing:-.02em}
        .cmp-item .delta small{display:block;margin-top:3px;font-size:11px;font-weight:600;color:var(--ink-faint)}
        .up{color:#D14A2A}.down{color:var(--green)}
        .insight{margin-top:18px;position:relative;overflow:hidden;border-radius:32px;color:#EAF6EE;background:radial-gradient(700px 400px at 10% 115%,rgba(216,242,110,.12),transparent 55%),linear-gradient(160deg,var(--deep2),var(--deep1));padding:clamp(38px,5vw,66px) clamp(24px,5vw,64px);box-shadow:0 34px 80px -38px rgba(14,42,27,.5)}
        .insight::before{content:"";position:absolute;inset:-40%;pointer-events:none;background:conic-gradient(from 0deg at 50% 50%,transparent 0deg,rgba(255,255,255,.045) 40deg,transparent 90deg);animation:sweep 22s linear infinite}
        @keyframes sweep{to{transform:rotate(360deg)}}
        .insight > *{position:relative}
        .insight .tag{font-size:12px;font-weight:800;letter-spacing:.18em;color:var(--lime)}
        .insight h3{margin-top:14px;font-size:clamp(22px,3.2vw,36px);font-weight:800;letter-spacing:-.03em;line-height:1.3}
        .insight h3 .hl{color:var(--lime)}
        .insight p{margin-top:18px;max-width:66ch;font-size:15px;color:rgba(234,246,238,.78);line-height:1.85;letter-spacing:-.01em}
        .logic{margin-top:30px;display:flex;flex-wrap:wrap;gap:10px;align-items:center}
        .logic .step{background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.14);padding:14px 18px;border-radius:16px;font-size:13.5px;font-weight:700;letter-spacing:-.01em;line-height:1.5}
        .logic .step small{display:block;margin-top:4px;font-size:11.5px;font-weight:500;color:rgba(234,246,238,.55)}
        .logic .arw{color:rgba(234,246,238,.4);font-weight:700}
        .footnote{margin-top:30px;text-align:center;font-size:11.5px;color:var(--ink-faint)}
        @media(max-width:900px){.grid2,.cmp-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="section">
        <span className="eyebrow reveal"><span className="dot" />DATA · 광주 교통 온실가스</span>
        <h2 className="title reveal d1">광주의 교통 배출,<br /><span className="hl">데이터가 말해주는 것</span></h2>
        <p className="lead reveal d2">2024년 광주광역시 차종별·연료별 온실가스 배출량을 들여다보면, 그린마일 팜 챌린지가 왜 &lsquo;승용차 대신 버스&rsquo;를 이야기하는지 그 답이 보입니다.</p>

        <div className="hero-stat reveal d2">
          <div className="cap">PASSENGER CARS — 2024</div>
          <div className="big"><span className="cnt" data-to="53.2" data-dec="1">0</span><span className="unit">%</span></div>
          <p className="desc">광주 교통 온실가스의 절반 이상은 <b>승용차</b>에서 나옵니다.<br />연간 배출량 <b>1,343.2천 톤</b> — 화물차·승합차·특수차를 모두 합친 것보다 많습니다.</p>
          <div className="src">광주광역시 차종별 온실가스 배출량 (2024년 기준)</div>
        </div>

        <div className="grid2">
          <div className="card reveal d1">
            <span className="tag">BY VEHICLE TYPE</span>
            <h3>차종별 배출량</h3>
            <p className="sub">승용차 &gt; 화물차 &gt; 승합차 &gt; 특수차 순 · 단위: 천 톤(2024)</p>
            <div className="bars">
              <div className="bar-row"><div className="top"><span>🚗 승용차</span><span className="val up"><span className="cnt" data-to="1343.2" data-dec="1">0</span> <small>천 톤 · 53.2%</small></span></div><div className="track"><div className="fill f-car" data-w="100" /></div></div>
              <div className="bar-row"><div className="top"><span>🚚 화물차</span><span className="val"><span className="cnt" data-to="930.3" data-dec="1">0</span> <small>천 톤</small></span></div><div className="track"><div className="fill f-truck" data-w="69.3" /></div></div>
              <div className="bar-row"><div className="top"><span>🚌 승합차</span><span className="val"><span className="cnt" data-to="193.0" data-dec="1">0</span> <small>천 톤</small></span></div><div className="track"><div className="fill f-van" data-w="14.4" /></div></div>
              <div className="bar-row"><div className="top"><span>🚜 특수차</span><span className="val"><span className="cnt" data-to="58.4" data-dec="1">0</span> <small>천 톤</small></span></div><div className="track"><div className="fill f-etc" data-w="4.3" /></div></div>
            </div>
            <div className="bar-note">승용차 등록대수는 <b>61.7만 대</b>(617,066대), 연간 주행거리는 <b>730,728.9만 km</b> — 승합차(16,576대 · 29,319.8만 km)의 <b>약 37배</b>에 달하는 규모입니다.</div>
          </div>

          <div className="card reveal d2">
            <span className="tag">BY FUEL TYPE</span>
            <h3>연료별 배출량</h3>
            <p className="sub">경유 &gt; 휘발유 &gt; LPG 순 · 단위: 천 톤(2024)</p>
            <div className="bars">
              <div className="bar-row"><div className="top"><span>⛽ 경유</span><span className="val"><span className="cnt" data-to="1322.0" data-dec="1">0</span> <small>천 톤</small></span></div><div className="track"><div className="fill f-diesel" data-w="100" /></div></div>
              <div className="bar-row"><div className="top"><span>⛽ 휘발유</span><span className="val"><span className="cnt" data-to="643.0" data-dec="1">0</span> <small>천 톤</small></span></div><div className="track"><div className="fill f-gas" data-w="48.6" /></div></div>
              <div className="bar-row"><div className="top"><span>🔵 LPG</span><span className="val"><span className="cnt" data-to="257.6" data-dec="1">0</span> <small>천 톤</small></span></div><div className="track"><div className="fill f-lpg" data-w="19.5" /></div></div>
            </div>
            <div className="bar-note">내연기관 승용차 중에서도 <b>경유·휘발유 차량</b>이 환경에 가장 치명적입니다. 매일의 경유·휘발유 승용차 출퇴근이 광주 배출량의 핵심 원인입니다.</div>
          </div>
        </div>

        <div className="cmp-grid">
          <div className="card reveal d1">
            <span className="tag">2018 → 2024</span>
            <h3>자동차 등록대수 변화</h3>
            <p className="sub">승용차는 늘고, 함께 타는 승합차는 줄었습니다</p>
            <div className="cmp">
              <div className="cmp-item"><span className="e">🚗</span><span className="name">승용차<small>548,234 → 617,066 대</small></span><span className="delta up">▲ 68,832<small>증가</small></span></div>
              <div className="cmp-item"><span className="e">🚌</span><span className="name">승합차<small>21,217 → 16,576 대</small></span><span className="delta down">▼ 4,641<small>감소</small></span></div>
            </div>
          </div>
          <div className="card reveal d2">
            <span className="tag">2018 → 2024</span>
            <h3>주행거리 변화</h3>
            <p className="sub">2021년 정점 후 감소하던 승용차 주행거리, 2024년 반등</p>
            <div className="cmp">
              <div className="cmp-item"><span className="e">🚗</span><span className="name">승용차<small>698,846.1 → 730,728.9 만 km</small></span><span className="delta up">▲ 4.6%<small>증가·반등</small></span></div>
              <div className="cmp-item"><span className="e">🚌</span><span className="name">승합차<small>42,533.8 → 29,319.8 만 km</small></span><span className="delta down">▼ 31.1%<small>감소</small></span></div>
            </div>
          </div>
        </div>

        <div className="insight reveal">
          <span className="tag">INSIGHT</span>
          <h3>1대의 버스가 무겁다고요?<br /><span className="hl">나눠 타면 가장 가볍습니다.</span></h3>
          <p>차 1대당 배출원단위는 버스(승합차)가 승용차보다 높지만, 버스에는 수십 명이 함께 탑승합니다. 그래서 <b style={{ color: 'var(--lime)' }}>1인당 탄소 배출량은 혼자 타는 승용차보다 훨씬 적습니다.</b> 게다가 광주는 승용차의 등록대수와 총 주행거리가 승합차보다 압도적으로 많아 전체 교통 배출량의 53.2%를 차지합니다. 그린마일 팜 챌린지가 &lsquo;자가용 대신 버스&rsquo;를 제안하는 이유입니다.</p>
          <div className="logic">
            <span className="step">🚗 나홀로 승용차<small>광주 교통 배출의 53.2%</small></span>
            <span className="arw">→</span>
            <span className="step">🚌 버스로 전환<small>1인당 배출량 대폭 감소</small></span>
            <span className="arw">→</span>
            <span className="step">🌱 작물이 자랍니다<small>감축량만큼 성장 + 실물 보상</small></span>
          </div>
        </div>

        <p className="footnote reveal">※ 출처: 광주광역시 차종별·연료별 온실가스 배출량 및 자동차 등록·주행거리 통계 (2024년 기준, 2018년 대비)</p>
      </div>
    </div>
  )
}
