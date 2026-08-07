// C. 데이터 양 · 서버 부하 점검 (읽기 전용)
import type { HealthContext } from './context'
import { fmtBytes, levelByMax, safeCheck, type CheckResult, type Level, TH } from './types'

const CAT = 'capacity' as const
const DAY = 24 * 60 * 60 * 1000
const SUPABASE_USAGE_URL = 'https://supabase.com/dashboard/project/_/settings/billing/usage'

/** 사용률(%)로 신호등을 정합니다. */
function levelByUsage(pct: number): Level {
  return levelByMax(pct, TH.usageWarnPct, TH.usageDangerPct)
}

export async function runCapacityChecks(ctx: HealthContext): Promise<CheckResult[]> {
  const out: CheckResult[] = []

  const certPhotos = ctx.storageStats?.find((s) => s.bucket === 'certification-photos')
  const totalStorageBytes = (ctx.storageStats ?? []).reduce((s, b) => s + Number(b.bytes), 0)

  // ---------------------------------------------------------
  // C1. 데이터베이스 용량
  // ---------------------------------------------------------
  out.push(
    await safeCheck('C1', CAT, '데이터베이스 용량', async () => {
      if (!ctx.dbStats) {
        return {
          id: 'C1',
          category: CAT,
          title: '데이터베이스 용량',
          level: 'warn',
          summary: '용량 조회 함수를 실행하지 못했습니다.',
          detail: ctx.dbStatsError ?? '알 수 없는 오류',
          action: 'supabase/11_health_logs.sql을 Supabase SQL Editor에서 실행하세요.',
        }
      }
      const used = Number(ctx.dbStats.db_bytes)
      const pct = (used / TH.quota.dbBytes) * 100
      const level = levelByUsage(pct)
      return {
        id: 'C1',
        category: CAT,
        title: '데이터베이스 용량',
        level,
        summary: `${fmtBytes(used)} 사용 중 — 포함량 8GB의 ${pct.toFixed(1)}%`,
        detail:
          'Supabase Pro 플랜은 데이터베이스 8GB가 포함됩니다. 이 수치는 참고용 추정치이며, 청구 기준은 Supabase 대시보드의 사용량 화면이 정확합니다.',
        action:
          level === 'ok'
            ? undefined
            : level === 'warn'
              ? '아직 여유가 있지만 증가 속도를 지켜보세요. 오래된 점검 기록(health_logs) 정리나 불필요한 데이터 삭제를 검토할 시점입니다.'
              : '포함량을 곧 넘깁니다. 초과분은 GB당 약 $0.125가 과금됩니다. Supabase 대시보드에서 사용량을 확인하세요.',
        link: level === 'ok' ? undefined : SUPABASE_USAGE_URL,
      }
    })
  )

  // ---------------------------------------------------------
  // C2. 파일 저장소(Storage) 용량
  // ---------------------------------------------------------
  out.push(
    await safeCheck('C2', CAT, '사진 저장소 용량', async () => {
      if (!ctx.storageStats) {
        return {
          id: 'C2',
          category: CAT,
          title: '사진 저장소 용량',
          level: 'warn',
          summary: '용량 조회 함수를 실행하지 못했습니다.',
          detail: ctx.storageStatsError ?? '알 수 없는 오류',
          action: 'supabase/11_health_logs.sql을 Supabase SQL Editor에서 실행하세요.',
        }
      }
      const pct = (totalStorageBytes / TH.quota.storageBytes) * 100
      const level = levelByUsage(pct)
      return {
        id: 'C2',
        category: CAT,
        title: '사진 저장소 용량',
        level,
        summary: `${fmtBytes(totalStorageBytes)} 사용 중 — 포함량 100GB의 ${pct.toFixed(2)}%`,
        detail: ctx.storageStats
          .map((b) => `${b.bucket}: 파일 ${b.files}개 · ${fmtBytes(Number(b.bytes))}`)
          .join(' / '),
        action:
          level === 'ok'
            ? undefined
            : '사진 업로드 압축 설정을 더 강하게 하거나, 주인 없는 파일(B11)을 정리해 공간을 확보하세요.',
        link: level === 'ok' ? undefined : SUPABASE_USAGE_URL,
      }
    })
  )

  // ---------------------------------------------------------
  // C3. 표별 크기 (어디가 무거운지)
  // ---------------------------------------------------------
  out.push(
    await safeCheck('C3', CAT, '표별 데이터 크기', async () => {
      if (!ctx.dbStats) {
        return {
          id: 'C3',
          category: CAT,
          title: '표별 데이터 크기',
          level: 'info',
          summary: '용량 조회 함수를 실행하지 못해 건너뛰었습니다.',
          detail: ctx.dbStatsError ?? undefined,
        }
      }
      const tables = ctx.dbStats.tables ?? []
      const total = tables.reduce((s, t) => s + Number(t.total_bytes), 0)
      const top = tables[0]
      const topPct = total > 0 && top ? (Number(top.total_bytes) / total) * 100 : 0
      return {
        id: 'C3',
        category: CAT,
        title: '표별 데이터 크기',
        level: topPct >= 70 ? 'warn' : 'info',
        summary: top
          ? `가장 큰 표는 ${top.name} (${fmtBytes(Number(top.total_bytes))}, 약 ${top.row_estimate}행)`
          : '표 정보를 읽지 못했습니다.',
        detail: tables
          .slice(0, 5)
          .map((t) => `${t.name} ${fmtBytes(Number(t.total_bytes))} / 약 ${t.row_estimate}행`)
          .join(' · '),
        action:
          topPct >= 70
            ? `${top?.name} 표가 전체의 ${topPct.toFixed(0)}%를 차지합니다. 지금은 문제없지만 계속 커지면 조회가 느려질 수 있습니다.`
            : undefined,
      }
    })
  )

  // ---------------------------------------------------------
  // C4. 증가 속도 · 챌린지 종료일까지 예측
  // ---------------------------------------------------------
  out.push(
    await safeCheck('C4', CAT, '데이터 증가 속도', async () => {
      const now = Date.now()
      const week = ctx.certs.filter((c) => now - new Date(c.created_at).getTime() <= 7 * DAY)
      const perDayCerts = week.length / 7
      const avgPhotoBytes =
        certPhotos && Number(certPhotos.files) > 0
          ? Number(certPhotos.bytes) / Number(certPhotos.files)
          : 0
      const perDayBytes = perDayCerts * 4 * avgPhotoBytes

      const endStr = ctx.settings?.challenge_end
      const end = endStr ? new Date(`${endStr}T23:59:59+09:00`).getTime() : null
      const daysLeft = end ? Math.max(0, Math.ceil((end - now) / DAY)) : null

      // 종료일이 없거나 지났으면 30일 앞을 내다봅니다.
      const horizon = daysLeft && daysLeft > 0 ? daysLeft : 30
      const horizonLabel =
        daysLeft && daysLeft > 0 ? `챌린지 종료(${endStr})까지 ${daysLeft}일` : '앞으로 30일'
      const predicted = totalStorageBytes + perDayBytes * horizon
      const pct = (predicted / TH.quota.storageBytes) * 100
      const level = levelByUsage(pct)

      return {
        id: 'C4',
        category: CAT,
        title: '데이터 증가 속도',
        level,
        summary:
          week.length === 0
            ? '최근 7일간 새 인증이 없어 증가 속도가 0입니다.'
            : `최근 7일 인증 ${week.length}건 — 하루 평균 ${perDayCerts.toFixed(1)}건 · ${fmtBytes(perDayBytes)}씩 늘고 있습니다.`,
        detail: `이 속도가 계속되면 ${horizonLabel} 뒤 저장소는 약 ${fmtBytes(predicted)} (포함량의 ${pct.toFixed(2)}%)가 됩니다. 사진 1장 평균 ${fmtBytes(avgPhotoBytes)} 기준의 참고용 추정치입니다.`,
        action:
          level === 'ok'
            ? undefined
            : '이 속도가 유지되면 포함량에 근접합니다. 사진 압축 강도를 높이거나 저장 기간 정책을 정하는 것을 검토하세요.',
      }
    })
  )

  // ---------------------------------------------------------
  // C5. 점검 응답 속도 추세 (서버가 느려지고 있는지)
  // ---------------------------------------------------------
  out.push(
    await safeCheck('C5', CAT, '응답 속도 추세', async () => {
      const past = ctx.recentDurationsMs.filter((n) => Number.isFinite(n) && n > 0)
      if (past.length < 3) {
        return {
          id: 'C5',
          category: CAT,
          title: '응답 속도 추세',
          level: 'info',
          summary: `비교할 기록이 아직 부족합니다. (${past.length}회 누적, 3회부터 비교)`,
          detail: '점검이 며칠 쌓이면 "평소보다 느려졌는지"를 자동으로 알려드립니다.',
        }
      }
      const avg = past.reduce((s, n) => s + n, 0) / past.length
      return {
        id: 'C5',
        category: CAT,
        title: '응답 속도 추세',
        level: 'info',
        summary: `최근 ${past.length}회 평균 ${(avg / 1000).toFixed(1)}초`,
        detail: `이번 점검이 평균의 ${TH.slowdownWarn}배를 넘으면 🟡, ${TH.slowdownDanger}배를 넘으면 🔴로 표시됩니다. (판정은 점검이 끝난 뒤 계산됩니다)`,
      }
    })
  )

  // ---------------------------------------------------------
  // C6. 인증 사진 평균 용량 (압축이 잘 되고 있는지)
  // ---------------------------------------------------------
  out.push(
    await safeCheck('C6', CAT, '사진 1장 평균 용량', async () => {
      if (!certPhotos || Number(certPhotos.files) === 0) {
        return {
          id: 'C6',
          category: CAT,
          title: '사진 1장 평균 용량',
          level: 'info',
          summary: '저장된 인증 사진이 없습니다.',
        }
      }
      const avg = Number(certPhotos.bytes) / Number(certPhotos.files)
      const level = levelByMax(avg, TH.avgPhotoWarnBytes, TH.avgPhotoDangerBytes)
      const pageBytes = avg * 15 * 4 // 관리자 인증 내역 1페이지 = 15건 × 4장
      return {
        id: 'C6',
        category: CAT,
        title: '사진 1장 평균 용량',
        level,
        summary: `평균 ${fmtBytes(avg)} (총 ${certPhotos.files}장)`,
        detail: `업로드 시 자동 압축이 동작하면 보통 1MB 안팎입니다. 참고: 관리자 인증 내역 1페이지(15건×4장)를 원본으로 불러오면 약 ${fmtBytes(pageBytes)}지만, 현재는 200px 썸네일을 쓰고 있어 실제 전송량은 이보다 훨씬 적습니다.`,
        action:
          level === 'ok'
            ? undefined
            : '사진이 압축되지 않고 원본 그대로 올라가고 있을 수 있습니다. 전송량(egress)이 빠르게 늘 수 있으니 알려주시면 압축 설정을 확인하겠습니다.',
      }
    })
  )

  // ---------------------------------------------------------
  // C7. 점검 기록 누적량
  // ---------------------------------------------------------
  out.push(
    await safeCheck('C7', CAT, '점검 기록 누적량', async () => {
      const rows = ctx.healthLogRows
      const level = levelByMax(rows, TH.logRowsWarn, TH.logRowsDanger)
      return {
        id: 'C7',
        category: CAT,
        title: '점검 기록 누적량',
        level,
        summary: `점검 기록 ${rows}건 보관 중`,
        detail: '자동 점검은 하루 1회라 1년에 약 365건씩 늘어납니다. 용량 부담은 거의 없습니다.',
        action:
          level === 'ok'
            ? undefined
            : '기록이 많이 쌓였습니다. 오래된 기록을 정리하고 싶으면 말씀해 주세요. (이 점검은 기록을 지우지 않습니다)',
      }
    })
  )

  // ---------------------------------------------------------
  // C8. 월 전송량(Egress) — 자동 측정 불가, 안내만
  // ---------------------------------------------------------
  out.push(
    await safeCheck('C8', CAT, '월 전송량(Egress)', async () => ({
      id: 'C8',
      category: CAT,
      title: '월 전송량(Egress)',
      level: 'info',
      summary: '이 항목만은 자동으로 측정할 수 없습니다. 직접 확인해 주세요.',
      detail:
        '전송량은 Supabase 서버 쪽 통계라 웹사이트 코드에서는 읽을 수 없습니다. (읽으려면 계정 전체를 조작할 수 있는 별도 토큰이 필요해 보안상 권하지 않습니다.) Pro 플랜 포함량은 월 250GB이며, 위 C4·C6 항목이 간접 신호가 됩니다.',
      action:
        '한 달에 한 번쯤 Supabase 대시보드 > Settings > Usage에서 Egress 막대를 확인하세요.',
      link: SUPABASE_USAGE_URL,
    }))
  )

  return out
}
