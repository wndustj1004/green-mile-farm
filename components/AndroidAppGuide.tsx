'use client'

import { useState, type CSSProperties } from 'react'

type Step = {
  alt: string
  title: string
  descPre: string
  descBold: string
  descPost: string
  tap: { left: string; top: string; width: string; height: string }
  tag: CSSProperties & { text: string }
}

const STEPS: Step[] = [
  {
    alt: '그린마일 팜 홈페이지 화면',
    title: '웹 화면에서 ⋮ 버튼 탭',
    descPre: '그린마일 팜 홈페이지에서 브라우저 우측 하단의 ',
    descBold: '점 3개(⋮)',
    descPost: ' 버튼을 눌러요.',
    tap: { left: '83%', top: '84%', width: '16%', height: '9%' },
    tag: { right: '100%', top: '-6px', transform: 'translateX(6px) rotate(-3deg)', text: '여기 탭' },
  },
  {
    alt: '브라우저 메뉴 화면',
    title: "'현재 페이지 추가' 선택",
    descPre: '메뉴가 열리면 ',
    descBold: '현재 페이지 추가',
    descPost: '를 눌러요.',
    tap: { left: '39%', top: '46%', width: '34%', height: '9%' },
    tag: { left: '100%', top: '-10px', transform: 'translateX(-6px) rotate(-2deg)', text: '현재 페이지 추가' },
  },
  {
    alt: '추가 위치 선택 화면',
    title: "'홈 화면' 선택",
    descPre: '추가할 위치 목록에서 ',
    descBold: '홈 화면',
    descPost: '을 골라요.',
    tap: { left: '1%', top: '72%', width: '29%', height: '9%' },
    tag: { left: '100%', top: '50%', transform: 'translate(6px,-50%) rotate(-2deg)', text: '홈 화면' },
  },
  {
    alt: '앱 이름 확인 화면',
    title: "이름 확인 후 '추가'",
    descPre: '앱 이름(그린마일 팜 챌린지)을 확인하고 ',
    descBold: '추가',
    descPost: '를 눌러요.',
    tap: { left: '60%', top: '84%', width: '26%', height: '12%' },
    tag: { left: '50%', top: '-14px', transform: 'translateX(-50%) rotate(-2deg)', text: '추가' },
  },
  {
    alt: '홈 화면 미리보기 화면',
    title: "'추가'로 확정",
    descPre: '홈 화면 미리보기에서 ',
    descBold: '추가',
    descPost: '를 한 번 더 누르면 끝!',
    tap: { left: '61%', top: '85%', width: '26%', height: '12%' },
    tag: { left: '50%', top: '-14px', transform: 'translateX(-50%) rotate(-2deg)', text: '추가' },
  },
  {
    alt: '홈 화면에 추가된 앱 아이콘',
    title: '홈에서 앱처럼 실행',
    descPre: '홈 화면에 아이콘이 생겨 바로 열 수 있어요. ',
    descBold: '',
    descPost: 'iPhone도 같은 방식이에요.',
    tap: { left: '4%', top: '3.5%', width: '23%', height: '13%' },
    tag: { left: '100%', top: '8px', transform: 'translateX(4px) rotate(-2deg)', text: '앱 생성 완료!' },
  },
]

// "그린마일 팜을 앱처럼 홈 화면에서 바로 열기 for Android" 6단계 가이드 (좌우 슬라이더)
export default function AndroidAppGuide() {
  const [i, setI] = useState(0)
  const total = STEPS.length
  const step = STEPS[i]
  const { text: tagText, ...tagStyle } = step.tag

  return (
    <div className="mt-8">
      <style jsx>{`
        .ag-ph { position: relative; background: #0c0c0c; border-radius: 32px; padding: 5px; box-shadow: 0 14px 40px rgba(20, 20, 20, 0.16); }
        .ag-ph__screen { position: relative; border-radius: 27px; overflow: hidden; background: #fff; }
        .ag-tap {
          position: absolute;
          border: 3.5px solid #2f7bf6;
          border-radius: 49% 51% 52% 48% / 48% 50% 50% 52%;
          box-shadow: 0 0 0 3px rgba(47, 123, 246, 0.16), 0 2px 8px rgba(47, 123, 246, 0.22);
          transform: rotate(-5deg);
          pointer-events: none;
        }
        @media (prefers-reduced-motion: no-preference) {
          .ag-tap { animation: ag-pulse 1.5s ease-in-out infinite; }
        }
        @keyframes ag-pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(47, 123, 246, 0.16), 0 2px 8px rgba(47, 123, 246, 0.22); }
          50% { box-shadow: 0 0 0 8px rgba(47, 123, 246, 0.04), 0 2px 8px rgba(47, 123, 246, 0.28); }
        }
        .ag-tap__tag {
          position: absolute;
          white-space: nowrap;
          background: #2f7bf6;
          color: #fff;
          font-weight: 800;
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 999px;
          box-shadow: 0 4px 12px rgba(47, 123, 246, 0.35);
        }
      `}</style>

      <p className="text-xs font-bold text-gm-ink2">How to use</p>
      <h2 className="mt-1 text-xl font-extrabold leading-snug tracking-tight text-gm-ink">
        그린마일 팜을 <span className="rounded-md bg-[#cdeccb] px-1.5 py-0.5 text-gm-green">앱처럼</span>
        <br />홈 화면에서 바로 열기 for Android
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-gm-muted">
        설치 없이 6단계면 끝. 브라우저에서 홈 화면에 추가하면 아이콘이 생겨 앱처럼 실행돼요.{' '}
        <b className="text-gm-green">파란 원</b>을 눌러 따라 해보세요.
      </p>

      <div className="mt-4 rounded-3xl border border-gm-line bg-white p-5">
        <span className="inline-block rounded-full bg-[#e7f2e2] px-3 py-1 text-[11px] font-bold tracking-wider text-gm-green">
          STEP {i + 1}
        </span>
        <div className="mt-4">
          <div className="ag-ph mx-auto w-full max-w-[220px]">
            <div className="ag-ph__screen">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/appguide-android/step${i + 1}.png`} alt={step.alt} className="block w-full" />
              <span
                className="ag-tap"
                style={{ left: step.tap.left, top: step.tap.top, width: step.tap.width, height: step.tap.height }}
              >
                <span className="ag-tap__tag" style={tagStyle}>
                  {tagText}
                </span>
              </span>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-[15px] font-bold text-gm-ink2">{step.title}</p>
        <p className="mx-auto mt-1.5 max-w-[240px] text-center text-xs leading-relaxed text-gm-muted">
          {step.descPre}
          {step.descBold && <b className="text-gm-green">{step.descBold}</b>}
          {step.descPost}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => setI(Math.max(0, i - 1))}
          disabled={i === 0}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gm-line text-gm-ink disabled:opacity-30"
          aria-label="이전"
        >
          ‹
        </button>
        <span className="text-sm font-bold text-gm-muted">
          {i + 1} / {total}
        </span>
        <button
          type="button"
          onClick={() => setI(Math.min(total - 1, i + 1))}
          disabled={i === total - 1}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gm-ink text-white disabled:opacity-30"
          aria-label="다음"
        >
          ›
        </button>
      </div>
    </div>
  )
}
