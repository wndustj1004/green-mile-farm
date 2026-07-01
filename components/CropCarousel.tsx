'use client'

import { useState } from 'react'

// G.P.S 작물 키우기 사진 좌우 슬라이드 (관리자가 업로드한 이미지 사용)
export default function CropCarousel({ images }: { images: string[] }) {
  const [i, setI] = useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="mt-5 flex h-52 items-center justify-center rounded-2xl border border-dashed border-gm-line bg-white text-sm text-gm-muted2">
        사진 준비 중 — 관리자 페이지에서 업로드하면 여기에 표시돼요
      </div>
    )
  }

  const n = images.length
  return (
    <div className="mt-5">
      <div className="relative overflow-hidden rounded-2xl border border-gm-line bg-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[i]} alt={`작물 사진 ${i + 1}`} className="h-64 w-full object-cover" />
        {n > 1 && (
          <>
            <button
              type="button"
              onClick={() => setI((i - 1 + n) % n)}
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-gm-ink shadow"
              aria-label="이전 사진"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setI((i + 1) % n)}
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-lg text-gm-ink shadow"
              aria-label="다음 사진"
            >
              ›
            </button>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="mt-3 flex justify-center gap-1.5">
          {images.map((_, d) => (
            <span key={d} className={`h-1.5 rounded-full ${d === i ? 'w-5 bg-gm-green' : 'w-1.5 bg-gm-line'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
