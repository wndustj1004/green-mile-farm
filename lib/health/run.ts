// 전체 점검 실행 + 결과 기록
//
// ★ 이 프로젝트에서 유일하게 "쓰기"를 하는 곳입니다. 그것도 health_logs 표에
//   결과 1줄을 남기는 것뿐이며, 기존 데이터는 절대 건드리지 않습니다.
import { createAdminClient } from '@/lib/supabase/admin'
import { loadHealthContext } from './context'
import { runInfraChecks } from './infra'
import { runIntegrityChecks } from './integrity'
import { runCapacityChecks } from './capacity'
import { worst, type CheckResult, type HealthReport, type Level, TH } from './types'

/** 결과가 너무 커지지 않게 사례 목록을 잘라냅니다. */
function trim(checks: CheckResult[]): CheckResult[] {
  return checks.map((c) => ({
    ...c,
    samples: c.samples?.slice(0, 20),
    detail: c.detail?.slice(0, 600),
  }))
}

export async function runHealthCheck(
  triggerBy: 'cron' | 'manual'
): Promise<HealthReport> {
  const started = Date.now()
  const sb = createAdminClient()

  let checks: CheckResult[] = []
  try {
    const ctx = await loadHealthContext(sb)
    checks = [
      ...(await runInfraChecks(sb)),
      ...(await runIntegrityChecks(ctx)),
      ...(await runCapacityChecks(ctx)),
    ]

    // C5(응답 속도 추세)는 전체 소요시간이 나와야 판정할 수 있습니다.
    const elapsed = Date.now() - started
    const past = ctx.recentDurationsMs.filter((n) => Number.isFinite(n) && n > 0)
    if (past.length >= 3) {
      const avg = past.reduce((s, n) => s + n, 0) / past.length
      const ratio = elapsed / avg
      const c5 = checks.find((c) => c.id === 'C5')
      if (c5) {
        c5.level =
          ratio >= TH.slowdownDanger ? 'danger' : ratio >= TH.slowdownWarn ? 'warn' : 'ok'
        c5.summary = `이번 ${(elapsed / 1000).toFixed(1)}초 · 최근 ${past.length}회 평균 ${(avg / 1000).toFixed(1)}초 (평균의 ${ratio.toFixed(1)}배)`
        c5.action =
          c5.level === 'ok'
            ? undefined
            : c5.level === 'warn'
              ? '평소보다 느립니다. 일시적인 지연일 수 있으니 내일 점검 결과를 함께 보세요.'
              : '평소보다 크게 느려졌습니다. Supabase 대시보드 > Reports에서 데이터베이스 부하를 확인하세요.'
      }
    }
  } catch (e) {
    // 데이터를 아예 읽지 못한 경우에도 기록은 남깁니다.
    const msg = e instanceof Error ? e.message : String(e)
    checks = [
      {
        id: 'A0',
        category: 'infra',
        title: '점검 실행',
        level: 'danger',
        summary: '점검에 필요한 데이터를 읽지 못해 중단됐습니다.',
        detail: msg.slice(0, 500),
        action:
          '데이터베이스 연결 자체가 끊겼을 가능성이 큽니다. Supabase 대시보드에서 프로젝트 상태(일시중지·사용량 초과)를 확인하세요.',
        link: 'https://supabase.com/dashboard',
      },
    ]
  }

  const durationMs = Date.now() - started
  const levels = checks.map((c) => c.level).filter((l): l is Level => l !== 'info')
  const counts = {
    ok: checks.filter((c) => c.level === 'ok').length,
    warn: checks.filter((c) => c.level === 'warn').length,
    danger: checks.filter((c) => c.level === 'danger').length,
    info: checks.filter((c) => c.level === 'info').length,
  }

  const report: HealthReport = {
    runAt: new Date().toISOString(),
    triggerBy,
    overall: worst(levels),
    durationMs,
    counts,
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    env: process.env.VERCEL_ENV ?? null,
    checks: trim(checks),
  }

  // 결과 기록 (실패해도 점검 결과 자체는 화면에 보여줍니다)
  try {
    await sb.from('health_logs').insert({
      run_at: report.runAt,
      trigger_by: report.triggerBy,
      overall: report.overall,
      duration_ms: report.durationMs,
      ok_count: counts.ok,
      warn_count: counts.warn,
      danger_count: counts.danger,
      commit_sha: report.commitSha,
      result: report.checks,
    })
  } catch {
    // health_logs 표가 아직 없을 수 있습니다(11번 SQL 미실행). 화면 표시는 계속 진행.
  }

  return report
}
