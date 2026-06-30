'use client'

import { useState } from 'react'
import { STAGE_EMOJI, STAGE_NAME, getGrowth } from '@/lib/growth'

// 단계별 감축 효과 (체감 비교) — 아이콘 순서: 전기 / 소나무 / 휘발유 / 차량
const EFFECT_ICONS = ['⚡', '🌲', '⛽', '🚗']

const STAGES: { range: string; effects: string[] }[] = [
  {
    range: '0 ~ 1.0kg CO₂ 감축',
    effects: [
      '전기 사용량 약 2.2kWh 절약한 효과',
      '30년생 소나무 1그루가 최대 약 55일 동안 흡수하는 CO₂량',
      '휘발유 기준 최대 약 0.43L 사용을 줄인 효과',
      '연비 12km/L 차량 기준 최대 약 5km 주행을 줄인 효과',
    ],
  },
  {
    range: '1.0 ~ 2.0kg CO₂ 감축',
    effects: [
      '전기 사용량 약 2.2~4.4kWh 절약한 효과',
      '30년생 소나무 1그루가 약 55~111일 동안 흡수하는 CO₂량',
      '휘발유 기준 약 0.43~0.87L 사용을 줄인 효과',
      '연비 12km/L 차량 기준 약 5~10km 주행을 줄인 효과',
    ],
  },
  {
    range: '2.0 ~ 3.5kg CO₂ 감축',
    effects: [
      '전기 사용량 약 4.4~7.7kWh 절약한 효과',
      '30년생 소나무 1그루가 약 111~194일 동안 흡수하는 CO₂량',
      '휘발유 기준 약 0.87~1.52L 사용을 줄인 효과',
      '연비 12km/L 차량 기준 약 10~18km 주행을 줄인 효과',
    ],
  },
  {
    range: '3.5 ~ 5.0kg CO₂ 감축',
    effects: [
      '전기 사용량 약 7.7~11.1kWh 절약한 효과',
      '30년생 소나무 1그루가 약 194~277일 동안 흡수하는 CO₂량',
      '휘발유 기준 약 1.52~2.16L 사용을 줄인 효과',
      '연비 12km/L 차량 기준 약 18~26km 주행을 줄인 효과',
    ],
  },
  {
    range: '5.0kg 이상 CO₂ 감축',
    effects: [
      '전기 사용량 약 11.1kWh 이상 절약한 효과',
      '30년생 소나무 1그루가 약 277일 이상 흡수해야 하는 CO₂량',
      '휘발유 기준 약 2.16L 이상 사용을 줄인 효과',
      '연비 12km/L 차량 기준 약 26km 이상 주행을 줄인 효과',
    ],
  },
]

export default function StageSlider({
  targetKg,
  totalKg,
}: {
  targetKg: number
  totalKg: number
}) {
  const current = getGrowth(totalKg, targetKg).stage // 1~5
  const [index, setIndex] = useState(current - 1)
  const isCurrent = index === current - 1
  const stage = STAGES[index]

  return (
    <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-700">작물 성장 단계</h2>
        <span className="text-xs text-gray-400">{index + 1} / 5</span>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="shrink-0 rounded-full px-2 py-6 text-2xl text-gray-300 hover:text-gray-500 disabled:opacity-20"
          aria-label="이전 단계"
        >
          ‹
        </button>

        <div className={`flex-1 rounded-2xl border-2 p-4 ${isCurrent ? 'border-green-500 bg-green-50/60' : 'border-gray-100'}`}>
          {/* 헤더 */}
          <div className="flex flex-col items-center text-center">
            <div className="text-6xl leading-none">{STAGE_EMOJI[index]}</div>
            <p className="mt-2 text-base font-bold text-green-700">
              {index + 1}단계 · {STAGE_NAME[index]}
            </p>
            <span className="mt-1 rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-700">
              {stage.range}
            </span>
            {isCurrent && (
              <span className="mt-2 rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                ★ 현재 내 단계
              </span>
            )}
          </div>

          {/* 감축 효과 인포그래픽 */}
          <ul className="mt-4 space-y-2">
            {stage.effects.map((e, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs leading-relaxed text-gray-600">
                <span className="text-base leading-none">{EFFECT_ICONS[i]}</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(4, i + 1))}
          disabled={index === 4}
          className="shrink-0 rounded-full px-2 py-6 text-2xl text-gray-300 hover:text-gray-500 disabled:opacity-20"
          aria-label="다음 단계"
        >
          ›
        </button>
      </div>

      {/* 점 인디케이터 */}
      <div className="mt-3 flex justify-center gap-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-green-600' : 'w-1.5 bg-gray-200'}`}
            aria-label={`${i + 1}단계`}
          />
        ))}
      </div>

      <p className="mt-3 text-center text-[10px] text-gray-300">※ 감축 효과는 참고용 추정치입니다.</p>
    </div>
  )
}
