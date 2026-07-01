'use client'

import { useState } from 'react'

const TITLES = ['웹 화면에서 … 버튼 탭', "'공유' 누르기", "'홈 화면에 추가' 선택", '홈에서 앱처럼 실행']
const DESCS = [
  '그린마일 팜 홈페이지에서 브라우저 하단의 점 3개(⋯) 버튼을 눌러요.',
  '메뉴가 열리면 맨 위 공유를 선택해요.',
  '목록을 내려 홈 화면에 추가를 누르면 끝!',
  '홈 화면에 아이콘이 생겨 바로 열 수 있어요. Android도 같은 방식이에요.',
]

// "그린마일 팜을 앱처럼 홈 화면에서 바로 열기" 4단계 가이드 (좌우 슬라이더)
export default function AppGuide() {
  const [i, setI] = useState(0)
  const total = 4

  return (
    <div className="mt-8">
      <p className="text-xs font-bold text-gm-ink2">How to use</p>
      <h2 className="mt-1 text-xl font-extrabold leading-snug tracking-tight text-gm-ink">
        그린마일 팜을 <span className="rounded-md bg-[#cdeccb] px-1.5 py-0.5 text-gm-green">앱처럼</span>
        <br />홈 화면에서 바로 열기
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-gm-muted">
        설치 없이 4단계면 끝. 브라우저에서 홈 화면에 추가하면 아이콘이 생겨 앱처럼 실행돼요.{' '}
        <b className="text-gm-green">파란 원</b>을 눌러 따라 해보세요.
      </p>

      <div className="mt-4 rounded-3xl border border-gm-line bg-white p-5">
        <span className="inline-block rounded-full bg-[#e7f2e2] px-3 py-1 text-[11px] font-bold tracking-wider text-gm-green">
          STEP {i + 1}
        </span>
        <div className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/appguide/step${i + 1}.png`}
            alt={`STEP ${i + 1} - ${TITLES[i]}`}
            className="mx-auto w-full max-w-[220px]"
          />
        </div>
        <p className="mt-4 text-center text-[15px] font-bold text-gm-ink2">{TITLES[i]}</p>
        <p className="mx-auto mt-1.5 max-w-[240px] text-center text-xs leading-relaxed text-gm-muted">{DESCS[i]}</p>
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
