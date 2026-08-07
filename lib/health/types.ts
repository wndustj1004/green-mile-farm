// 상태 점검(Health Check) 공통 타입 · 임계값 정의
//
// ★ 원칙: 여기서부터 이어지는 lib/health/* 는 데이터를 "읽기만" 합니다.
//   유일한 쓰기는 run.ts 가 health_logs 표에 결과 1줄을 남기는 것뿐입니다.

/** 신호등. info = 판정 없는 참고 정보 */
export type Level = 'ok' | 'warn' | 'danger' | 'info'

export type CheckCategory = 'infra' | 'integrity' | 'capacity'

export type CheckResult = {
  id: string // 예: 'A1'
  category: CheckCategory
  title: string // 항목 이름 (한국어)
  level: Level
  summary: string // 결과 한 줄
  detail?: string // 숫자 상세
  action?: string // "무엇을 해야 하나요"
  link?: string // 바로가기 (사이트 내부 경로 또는 외부 URL)
  samples?: string[] // 문제 사례 (최대 20건)
  ms?: number // 이 항목에 걸린 시간
}

export type HealthReport = {
  runAt: string
  triggerBy: 'cron' | 'manual'
  overall: 'ok' | 'warn' | 'danger'
  durationMs: number
  counts: { ok: number; warn: number; danger: number; info: number }
  commitSha: string | null
  env: string | null
  checks: CheckResult[]
}

// -------------------------------------------------------------
// 임계값 — 운영하면서 조정하고 싶으면 이 값만 고치면 됩니다.
// -------------------------------------------------------------
export const TH = {
  /** 응답 시간(밀리초) */
  respWarnMs: 1000,
  respDangerMs: 3000,
  rpcWarnMs: 2000,
  rpcDangerMs: 5000,

  /** 교통수단별 1회 이동거리 상한(km) — 승인된 인증만 판정 */
  distance: {
    walk: { warn: 15, danger: 30 },
    bike: { warn: 40, danger: 80 },
    bus: { warn: 50, danger: 100 },
    subway: { warn: 50, danger: 100 },
  } as Record<string, { warn: number; danger: number }>,

  /** 미검토 인증이 방치된 일수 */
  unreviewedWarnDays: 3,
  unreviewedDangerDays: 7,

  /** DB에 기록됐는데 실제 파일이 없는 사진 건수 */
  missingPhotoWarn: 1,
  missingPhotoDanger: 3,

  /** 주인 없는(고아) 사진 파일 개수 */
  orphanFileWarn: 10,

  /** Supabase Pro 플랜 포함량 (2026-08 기준 공식 가격표) */
  quota: {
    dbBytes: 8 * 1024 ** 3, // 8 GB
    storageBytes: 100 * 1024 ** 3, // 100 GB
    egressBytes: 250 * 1024 ** 3, // 250 GB/월 (앱에서 측정 불가 — 안내만)
  },
  /** 자원 사용률(%) */
  usageWarnPct: 50,
  usageDangerPct: 80,

  /** 인증 사진 1장 평균 용량(바이트) — 압축이 동작하는지 판단 */
  avgPhotoWarnBytes: 2 * 1024 ** 2, // 2 MB
  avgPhotoDangerBytes: 4 * 1024 ** 2, // 4 MB

  /** 점검 소요시간이 최근 평균의 몇 배까지 정상인가 */
  slowdownWarn: 1.5,
  slowdownDanger: 3,

  /** health_logs 누적 행 수 */
  logRowsWarn: 1000,
  logRowsDanger: 3000,
}

// -------------------------------------------------------------
// 작은 도우미들
// -------------------------------------------------------------

/** 여러 신호등 중 가장 나쁜 것을 고릅니다. (info는 판정에서 제외) */
export function worst(levels: Level[]): 'ok' | 'warn' | 'danger' {
  if (levels.includes('danger')) return 'danger'
  if (levels.includes('warn')) return 'warn'
  return 'ok'
}

/** 값이 임계선을 넘었는지로 신호등을 정합니다. (클수록 나쁨) */
export function levelByMax(value: number, warn: number, danger: number): Level {
  if (value >= danger) return 'danger'
  if (value >= warn) return 'warn'
  return 'ok'
}

/** 바이트 → 사람이 읽는 단위 */
export function fmtBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '-'
  if (n < 1024) return `${n} B`
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`
  return `${(n / 1024 ** 3).toFixed(2)} GB`
}

/** 실행 시간을 함께 재주는 도우미 */
// Supabase 쿼리 빌더는 Promise가 아니라 PromiseLike라서 이렇게 받습니다.
export async function timed<T>(fn: () => PromiseLike<T>): Promise<{ value: T; ms: number }> {
  const t = Date.now()
  const value = await fn()
  return { value, ms: Date.now() - t }
}

/** 점검 하나가 예외로 죽어도 전체가 멈추지 않도록 감쌉니다. */
export async function safeCheck(
  id: string,
  category: CheckCategory,
  title: string,
  fn: () => Promise<CheckResult>
): Promise<CheckResult> {
  try {
    return await fn()
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return {
      id,
      category,
      title,
      level: 'danger',
      summary: '점검 도중 오류가 발생해 확인하지 못했습니다.',
      detail: msg.slice(0, 300),
      action:
        '이 항목만 실패한 것이라면 잠시 후 [지금 전체 점검 실행]을 다시 눌러보세요. 계속 같은 오류가 나면 오류 내용을 그대로 전달해 주세요.',
    }
  }
}
