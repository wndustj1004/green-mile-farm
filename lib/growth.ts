// 작물 성장 단계 계산 (대시보드 + 인증 등록에서 공통 사용)
// 임시로 이모지를 작물 이미지로 사용합니다. 나중에 실제 일러스트로 교체 가능.

export const STAGE_EMOJI = ['🌱', '🍃', '🌿', '🌼', '🍅'] // 1~5단계
export const STAGE_NAME = ['새싹', '잎', '줄기·잎', '꽃', '빨간 방울토마토(수확 가능)']

// 각 단계가 '시작되는' 지점(목표 대비 비율). 목표 5kg 기준 0 / 1.0 / 2.0 / 3.5 / 5.0kg.
export const STAGE_START_RATIO = [0, 0.2, 0.4, 0.7, 1]

export type Growth = {
  stage: number // 1~5
  emoji: string
  stageName: string
  percent: number // 0~100 (성장 상태바 채움 비율)
  harvested: boolean // 5단계(목표 달성) 여부
}

export function getGrowth(totalKg: number, targetKg: number): Growth {
  const ratio = targetKg > 0 ? totalKg / targetKg : 0

  let stage = 1
  for (let i = STAGE_START_RATIO.length - 1; i >= 0; i--) {
    if (ratio >= STAGE_START_RATIO[i]) {
      stage = i + 1
      break
    }
  }

  const percent = Math.min(Math.max(ratio, 0), 1) * 100
  const harvested = targetKg > 0 && totalKg >= targetKg

  return {
    stage,
    emoji: STAGE_EMOJI[stage - 1],
    stageName: STAGE_NAME[stage - 1],
    percent,
    harvested,
  }
}
