'use client'

import { useState } from 'react'

// 이동 인증 방법 좌우 슬라이더 튜토리얼
// examples[0] = 지도 스크린샷 예시, examples[1] = 실제 공간 사진 예시 (관리자 업로드 시 표시)
export default function CertifyTutorial({
  texts,
  examples = [],
}: {
  texts: Record<string, string>
  examples?: string[]
}) {
  const [i, setI] = useState(0)

  const mapEx = examples[0]
  const placeEx = examples[1]

  const cards = [
    {
      n: 1,
      title: texts['guide.t1_title'],
      desc: texts['guide.t1_desc'],
      body: <div className="mt-3 flex justify-center gap-2 text-3xl">🚶 🚲 🚌 🚇</div>,
    },
    {
      n: 2,
      title: texts['guide.t2_title'],
      desc: texts['guide.t2_desc'],
      body: <ExampleFrame url={mapEx} label="지도 스크린샷 예시" />,
    },
    {
      n: 3,
      title: texts['guide.t3_title'],
      desc: texts['guide.t3_desc'],
      body: (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <ExampleFrame url={placeEx} label="① 실제 공간 사진" small />
          <ExampleFrame url={mapEx} label="② 지도 현재위치" small />
        </div>
      ),
    },
    {
      n: 4,
      title: texts['guide.t4_title'],
      desc: texts['guide.t4_desc'],
      body: <div className="mt-3 text-center text-5xl">🌱</div>,
    },
  ]

  const total = cards.length
  const c = cards[i]

  return (
    <div className="rounded-3xl border border-gm-line bg-white p-6">
      <div className="flex items-center justify-between">
        <span className="rounded-full bg-gm-fill px-3 py-1 text-xs font-bold text-gm-green">
          STEP {c.n}
        </span>
        <span className="text-xs text-gm-muted2">
          {i + 1} / {total}
        </span>
      </div>

      <div className="mt-4 min-h-[190px]">
        <p className="text-lg font-bold text-gm-ink2">{c.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-gm-muted">{c.desc}</p>
        {c.body}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setI(Math.max(0, i - 1))}
          disabled={i === 0}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gm-line text-gm-ink disabled:opacity-30"
          aria-label="이전"
        >
          ‹
        </button>
        <div className="flex gap-1.5">
          {cards.map((_, d) => (
            <span key={d} className={`h-1.5 rounded-full ${d === i ? 'w-5 bg-gm-green' : 'w-1.5 bg-gm-line'}`} />
          ))}
        </div>
        <button
          type="button"
          onClick={() => setI(Math.min(total - 1, i + 1))}
          disabled={i === total - 1}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gm-line text-gm-ink disabled:opacity-30"
          aria-label="다음"
        >
          ›
        </button>
      </div>
    </div>
  )
}

function ExampleFrame({ url, label, small }: { url?: string; label: string; small?: boolean }) {
  return (
    <div
      className={`mx-auto mt-3 aspect-[3/4] w-full overflow-hidden rounded-xl border border-gm-line bg-gm-cream2 ${
        small ? '' : 'max-w-[240px]'
      }`}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="h-full w-full object-contain" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center text-center text-[11px] text-gm-muted2">
          <span className="mb-1 text-lg">🖼️</span>
          {label}
          <span className="mt-0.5 text-[10px]">(예시 이미지 준비 중)</span>
        </div>
      )}
    </div>
  )
}
