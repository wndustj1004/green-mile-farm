// 보상(REWARD) 쇼케이스 — 가로 스크롤 레일(보상카드·토마토바질청·에이드레시피·배송노트).
// 제공된 디자인(greenmilefarm_reward.html)을 React로 포팅.
// 섹션 전체의 스크롤 진입 페이드업은 상위 <Reveal>이 담당하고, 여기서는
// 패널 순차 등장(로드 시)·호버(칩/이미지)·화살표/배지 등 idle 애니메이션으로 생동감을 준다.
// 스타일은 루트(.rw-showcase)로 스코프한 일반 CSS(하위 컴포넌트까지 안전 적용).
export default function RewardShowcase() {
  return (
    <div className="rw-showcase">
      <span className="rw-tag">REWARD</span>
      <h2 className="rw-title">
        화면 속 텃밭이,
        <br />
        <span className="hl">진짜 수확</span>이 됩니다
      </h2>
      <p className="rw-lead">
        그린마일 팜의 보상은 그림이 아닙니다. G.P.S 임원진이 커피박 퇴비로 직접 키운{' '}
        <b>방울토마토와 바질로 만든 토마토 바질 청</b>이 당신에게 도착합니다.
        <span className="ship">
          회원가입 시 작성하였던 주소는 보상 수령 배송지로 쓰여, 안전하고 신선하게 비대면 배달해 드립니다!
        </span>
      </p>

      <div className="rw-hint">
        <span>옆으로 밀어 보상을 확인하세요</span>
        <span className="line" />
        <span className="arrow">➜</span>
      </div>

      <div className="rw-rail">
        {/* 1. 보상 카드 + 구성 칩 */}
        <section className="panel p-reward">
          <span className="pill">REWARD</span>
          <h3>
            목표 5kg 달성 시,
            <br />
            토마토 바질 청을 받아요! 🎁
          </h3>
          <p>
            커피박(커피 찌꺼기) 퇴비로 기른 <b>방울토마토와 바질</b>을 정성껏 담아 <b>토마토 바질 청</b>으로 만들어,
            비닐 대신 여러 번 재사용 가능한 <b>밀랍랩·유리병</b>에 포장해 배송해 드립니다.
          </p>
          <div className="chips">
            <Chip e="🍅" nm="방울토마토" ds="직접 재배한 열매" />
            <Chip e="🌿" nm="바질" ds="향긋한 허브" />
            <Chip e="🫙" nm="토마토 바질 청" ds="정성껏 담근 수제청" />
            <Chip e="☕" nm="커피박 퇴비" ds="카페 폐기물의 순환" />
          </div>
        </section>

        {/* 2. 보상 물품 사진 카드 */}
        <section className="panel p-card">
          <div className="media">
            <span className="ribbon">보상 물품</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/reward/cheong.jpg" alt="토마토 바질 청" loading="lazy" />
          </div>
          <div className="cbody">
            <h3>토마토 바질 청 🫙</h3>
            <div className="sub">G.P.S 임원진이 직접 담근 수제청</div>
            <p className="desc">
              커피박 퇴비로 키운 <b>방울토마토</b>와 <b>바질</b>을 유리병에 켜켜이 담아 숙성시킨 향긋한 수제청입니다. 달콤한
              토마토 과육과 은은한 바질 향이 시럽 속에 그대로 살아 있어, 물·우유·탄산수 무엇에 타도 근사한 한 잔이 됩니다.
            </p>
          </div>
        </section>

        {/* 3. 레시피 카드 */}
        <section className="panel p-card">
          <div className="media">
            <span className="ribbon">RECIPE · 토마토 바질 에이드</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/reward/ade.jpg" alt="토마토 바질 에이드" loading="lazy" />
          </div>
          <div className="cbody">
            <h3>토마토 바질 에이드 🥤</h3>
            <div className="sub">청 + 탄산수 = 상큼한 홈카페 한 잔</div>
            <div className="ratio">
              <span>토마토 바질 청 3</span>
              <span>탄산수 7</span>
              <span>얼음 가득</span>
            </div>
            <div className="steps">
              <Step n="1">
                유리컵에 <b>얼음</b>을 가득 채웁니다.
              </Step>
              <Step n="2">
                <b>토마토 바질 청</b>을 과육과 함께 3스푼 넣어요.
              </Step>
              <Step n="3">
                차가운 <b>탄산수</b>를 천천히 부어 7 비율로 채웁니다.
              </Step>
              <Step n="4">
                가볍게 저은 뒤 <b>생바질 잎</b>을 올려 완성! 🌿
              </Step>
            </div>
          </div>
        </section>

        {/* 4. 배송 노트 */}
        <section className="panel p-note">
          <h3>
            화면 밖으로 배달되는
            <br />
            <span className="hl">진짜 수확</span>의 맛
          </h3>
          <p>
            회원가입 시 작성한 주소로, 임원진이 직접 키우고 담근 토마토 바질 청을 안전하고 신선하게 <b>비대면 배송</b>해
            드립니다. 오늘의 실천이 내일의 한 잔이 됩니다.
          </p>
          <div className="badge">🎯 목표 5kg 달성 → 🫙 토마토 바질 청 배송</div>
        </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: CSS }} />
    </div>
  )
}

function Chip({ e, nm, ds }: { e: string; nm: string; ds: string }) {
  return (
    <div className="chip">
      <div className="emo">{e}</div>
      <div className="nm">{nm}</div>
      <div className="ds">{ds}</div>
    </div>
  )
}

function Step({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <div className="step">
      <div className="no">{n}</div>
      <div className="tx">{children}</div>
    </div>
  )
}

const CSS = `
.rw-showcase{--purple:#7b5cfa;--purple-deep:#6b3fe4;--ink:#1c1c22;--muted:#5a5a66;
  --card:rgba(255,255,255,0.14);--card-line:rgba(255,255,255,0.28);}
.rw-showcase .rw-tag{display:inline-flex;align-items:center;gap:8px;background:#e7e2fb;
  color:var(--purple-deep);font-weight:800;font-size:13px;letter-spacing:1px;
  padding:9px 18px;border-radius:999px;}
.rw-showcase .rw-tag::before{content:"";width:8px;height:8px;border-radius:50%;
  background:var(--purple-deep);animation:rw-pulse 2.2s ease-in-out infinite;}
.rw-showcase .rw-title{font-size:clamp(32px,5.4vw,56px);font-weight:900;line-height:1.12;
  margin-top:24px;letter-spacing:-1.5px;color:var(--ink);}
.rw-showcase .rw-title .hl{color:var(--purple);}
.rw-showcase .rw-lead{margin-top:20px;max-width:760px;font-size:clamp(15px,1.9vw,18px);
  line-height:1.7;color:var(--muted);}
.rw-showcase .rw-lead b{color:var(--ink);font-weight:800;}
.rw-showcase .rw-lead .ship{display:block;margin-top:12px;color:var(--purple-deep);font-weight:600;}
.rw-showcase .rw-hint{display:flex;align-items:center;gap:10px;margin:34px 0 12px;
  color:var(--purple-deep);font-weight:700;font-size:14px;}
.rw-showcase .rw-hint .line{flex:0 0 46px;height:2px;
  background:linear-gradient(90deg,var(--purple),transparent);}
.rw-showcase .rw-hint .arrow{animation:rw-nudge 1.4s ease-in-out infinite;}
.rw-showcase .rw-rail{display:flex;gap:24px;overflow-x:auto;overflow-y:hidden;
  padding:12px 4px 26px;scroll-snap-type:x mandatory;scroll-behavior:smooth;
  scrollbar-color:var(--purple) #e3ddf6;scrollbar-width:thin;}
.rw-showcase .rw-rail::-webkit-scrollbar{height:12px;}
.rw-showcase .rw-rail::-webkit-scrollbar-track{background:#e3ddf6;border-radius:999px;}
.rw-showcase .rw-rail::-webkit-scrollbar-thumb{background:var(--purple);border-radius:999px;
  border:3px solid #e3ddf6;}
.rw-showcase .panel{scroll-snap-align:start;flex:0 0 auto;border-radius:28px;
  box-shadow:0 26px 60px -28px rgba(85,60,200,0.55);position:relative;overflow:hidden;
  transition:box-shadow .3s ease,transform .3s ease;}
.rw-showcase .panel:hover{box-shadow:0 34px 70px -26px rgba(85,60,200,0.6);transform:translateY(-4px);}
.rw-showcase .p-reward{width:min(88vw,720px);
  background:linear-gradient(145deg,#8a63ff 0%,#6f45ec 55%,#5a34d6 100%);
  color:#fff;padding:46px 40px;}
.rw-showcase .p-reward .pill{display:inline-block;background:rgba(255,255,255,0.22);
  color:#fff;font-weight:800;letter-spacing:2px;font-size:12px;padding:9px 20px;border-radius:999px;}
.rw-showcase .p-reward h3{font-size:clamp(26px,4.2vw,42px);font-weight:900;line-height:1.15;
  margin-top:22px;letter-spacing:-1px;}
.rw-showcase .p-reward>p{margin-top:18px;font-size:15.5px;line-height:1.7;
  color:rgba(255,255,255,0.9);max-width:560px;}
.rw-showcase .p-reward>p b{color:#fff;font-weight:800;}
.rw-showcase .chips{display:flex;gap:12px;flex-wrap:wrap;margin-top:30px;}
.rw-showcase .chip{flex:1 1 130px;min-width:130px;background:var(--card);
  border:1px solid var(--card-line);border-radius:18px;padding:20px 12px;text-align:center;
  backdrop-filter:blur(6px);transition:transform .22s ease,background .22s ease;}
.rw-showcase .chip:hover{transform:translateY(-5px);background:rgba(255,255,255,0.22);}
.rw-showcase .chip .emo{font-size:30px;display:inline-block;}
.rw-showcase .chip:hover .emo{animation:rw-pop .5s ease;}
.rw-showcase .chip .nm{margin-top:10px;font-weight:800;font-size:15px;color:#fff;}
.rw-showcase .chip .ds{margin-top:5px;font-size:12px;color:rgba(255,255,255,0.75);}
.rw-showcase .p-card{width:min(88vw,540px);background:#fff;display:flex;flex-direction:column;}
.rw-showcase .media{position:relative;aspect-ratio:16/10;overflow:hidden;}
.rw-showcase .media img{width:100%;height:100%;object-fit:cover;display:block;
  transition:transform .6s ease;}
.rw-showcase .p-card:hover .media img{transform:scale(1.06);}
.rw-showcase .ribbon{position:absolute;top:16px;left:16px;z-index:1;background:var(--purple-deep);
  color:#fff;font-weight:800;font-size:12px;letter-spacing:1px;padding:8px 16px;border-radius:999px;
  box-shadow:0 8px 20px -8px rgba(0,0,0,.4);}
.rw-showcase .cbody{padding:28px 30px 32px;}
.rw-showcase .cbody h3{font-size:24px;font-weight:900;letter-spacing:-0.5px;color:var(--ink);}
.rw-showcase .cbody .sub{margin-top:6px;color:var(--purple-deep);font-weight:700;font-size:14px;}
.rw-showcase .cbody .desc{margin-top:15px;color:var(--muted);font-size:14.5px;line-height:1.7;}
.rw-showcase .cbody .desc b{color:var(--ink);font-weight:800;}
.rw-showcase .steps{margin-top:20px;display:flex;flex-direction:column;gap:13px;}
.rw-showcase .step{display:flex;gap:13px;align-items:flex-start;}
.rw-showcase .step .no{flex:0 0 30px;height:30px;border-radius:50%;background:#efeafe;
  color:var(--purple-deep);font-weight:900;display:flex;align-items:center;justify-content:center;font-size:14px;}
.rw-showcase .step .tx{font-size:14px;line-height:1.55;color:#333;padding-top:3px;}
.rw-showcase .step .tx b{color:var(--purple-deep);}
.rw-showcase .ratio{margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;}
.rw-showcase .ratio span{background:#f2eefe;color:var(--purple-deep);font-weight:700;
  font-size:13px;padding:8px 14px;border-radius:10px;}
.rw-showcase .p-note{width:min(88vw,400px);background:linear-gradient(160deg,#efeafe,#e2d9fb);
  padding:42px 36px;display:flex;flex-direction:column;justify-content:center;}
.rw-showcase .p-note h3{font-size:24px;font-weight:900;line-height:1.3;letter-spacing:-0.5px;color:var(--ink);}
.rw-showcase .p-note h3 .hl{color:var(--purple-deep);}
.rw-showcase .p-note p{margin-top:16px;color:#4a4560;font-size:14.5px;line-height:1.75;}
.rw-showcase .p-note p b{font-weight:800;}
.rw-showcase .p-note .badge{margin-top:24px;align-self:flex-start;background:#fff;border-radius:16px;
  padding:15px 20px;font-weight:800;color:var(--purple-deep);
  box-shadow:0 14px 30px -16px rgba(90,60,200,.5);font-size:14.5px;
  animation:rw-float 3s ease-in-out infinite;}
@keyframes rw-nudge{0%,100%{transform:translateX(0);}50%{transform:translateX(7px);}}
@keyframes rw-pulse{0%,100%{transform:scale(1);opacity:1;}50%{transform:scale(1.5);opacity:.5;}}
@keyframes rw-float{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}
@keyframes rw-pop{0%{transform:scale(1);}45%{transform:scale(1.28) rotate(-6deg);}100%{transform:scale(1);}}
@media (prefers-reduced-motion:reduce){
  .rw-showcase .rw-tag::before,.rw-showcase .rw-hint .arrow,.rw-showcase .p-note .badge{animation:none;}
}
@media (max-width:640px){
  .rw-showcase .p-reward{padding:36px 24px;}
  .rw-showcase .cbody{padding:22px 20px 28px;}
}
`
