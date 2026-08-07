import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import type { CheckResult, Level } from '@/lib/health/types'
import RunButton from './RunButton'

export const dynamic = 'force-dynamic'

type LogRow = {
  id: string
  run_at: string
  trigger_by: 'cron' | 'manual'
  overall: 'ok' | 'warn' | 'danger'
  duration_ms: number
  ok_count: number
  warn_count: number
  danger_count: number
  commit_sha: string | null
  result: CheckResult[]
}

const LV: Record<Level, { emoji: string; label: string; bar: string; chip: string }> = {
  ok: { emoji: '🟢', label: '정상', bar: 'border-l-gm-leaf', chip: 'bg-gm-fill text-gm-green' },
  warn: { emoji: '🟡', label: '주의', bar: 'border-l-amber-400', chip: 'bg-amber-50 text-amber-700' },
  danger: { emoji: '🔴', label: '위험', bar: 'border-l-red-500', chip: 'bg-red-50 text-red-700' },
  info: { emoji: 'ℹ️', label: '참고', bar: 'border-l-gray-300', chip: 'bg-gray-100 text-gray-600' },
}

const CATEGORY_TITLE: Record<string, string> = {
  infra: 'A. 서버 · 인프라 안정성',
  integrity: 'B. 데이터 무결성',
  capacity: 'C. 데이터 양 · 서버 부하',
}

const OVERALL_MSG = {
  ok: { emoji: '🟢', head: '모두 정상입니다', body: '지금은 따로 하실 일이 없습니다.' },
  warn: {
    emoji: '🟡',
    head: '주의할 항목이 있습니다',
    body: '급하지는 않지만, 아래 노란색 항목을 한 번 확인해 주세요.',
  },
  danger: {
    emoji: '🔴',
    head: '지금 확인이 필요합니다',
    body: '아래 빨간색 항목부터 조치해 주세요. 참가자에게 문제가 보이고 있을 수 있습니다.',
  },
}

function fmtKST(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function AdminHealthPage() {
  const supabase = createClient()
  const { data: logs, error } = await supabase
    .from('health_logs')
    .select('*')
    .order('run_at', { ascending: false })
    .limit(30)

  // 11번 SQL을 아직 실행하지 않은 경우
  if (error) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-800">상태 점검</h1>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-semibold text-amber-800">준비가 한 단계 남았습니다</p>
          <p className="mt-2 text-sm leading-relaxed text-amber-900">
            점검 결과를 저장할 표(<code className="rounded bg-white px-1">health_logs</code>)가 아직
            없습니다. Supabase 대시보드 &gt; SQL Editor에서{' '}
            <code className="rounded bg-white px-1">supabase/11_health_logs.sql</code> 파일 내용을
            붙여넣고 <b>Run</b>을 눌러주세요. 그 다음 이 페이지를 새로고침하면 됩니다.
          </p>
          <p className="mt-3 text-xs text-amber-700">오류 내용: {error.message}</p>
        </div>
      </div>
    )
  }

  const rows = (logs ?? []) as LogRow[]
  const latest = rows[0] ?? null
  const checks = latest?.result ?? []
  const attention = checks.filter((c) => c.level === 'danger' || c.level === 'warn')

  return (
    <div className="space-y-6">
      {/* 머리말 + 실행 버튼 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">상태 점검</h1>
          <p className="mt-1 text-sm text-gray-500">
            서버·데이터베이스가 정상인지, 데이터에 이상이 없는지 자동으로 확인합니다.
            <br />
            매일 <b>오후 8시대</b>에 한 번 자동 실행되고, 아래 버튼으로 언제든 직접 실행할 수
            있습니다.
          </p>
        </div>
        <RunButton />
      </div>

      {!latest ? (
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <p className="text-3xl">🌱</p>
          <p className="mt-3 font-semibold text-gray-700">아직 점검 기록이 없습니다</p>
          <p className="mt-1 text-sm text-gray-500">
            위의 [지금 전체 점검 실행] 버튼을 눌러 첫 점검을 시작해 보세요.
          </p>
        </div>
      ) : (
        <>
          {/* 종합 판정 */}
          <div
            className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${LV[latest.overall].bar}`}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-3xl">{OVERALL_MSG[latest.overall].emoji}</span>
              <div>
                <p className="text-lg font-bold text-gray-800">
                  {OVERALL_MSG[latest.overall].head}
                </p>
                <p className="text-sm text-gray-500">{OVERALL_MSG[latest.overall].body}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
              <span>마지막 점검 {fmtKST(latest.run_at)}</span>
              <span>·</span>
              <span>{latest.trigger_by === 'cron' ? '자동 점검' : '직접 실행'}</span>
              <span>·</span>
              <span>{(latest.duration_ms / 1000).toFixed(1)}초 소요</span>
              {latest.commit_sha && (
                <>
                  <span>·</span>
                  <span>버전 {latest.commit_sha.slice(0, 7)}</span>
                </>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Count label="정상" n={latest.ok_count} cls={LV.ok.chip} />
              <Count label="주의" n={latest.warn_count} cls={LV.warn.chip} />
              <Count label="위험" n={latest.danger_count} cls={LV.danger.chip} />
            </div>
          </div>

          {/* 확인이 필요한 항목 먼저 */}
          {attention.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-700">
                지금 확인이 필요한 항목 ({attention.length}건)
              </h2>
              {attention
                .sort((a, b) => (a.level === 'danger' ? -1 : 1) - (b.level === 'danger' ? -1 : 1))
                .map((c) => (
                  <CheckCard key={`top-${c.id}`} c={c} />
                ))}
            </section>
          )}

          {/* 전체 항목 */}
          {(['infra', 'integrity', 'capacity'] as const).map((cat) => {
            const items = checks.filter((c) => c.category === cat)
            if (items.length === 0) return null
            return (
              <section key={cat} className="space-y-3">
                <h2 className="text-sm font-semibold text-gray-700">{CATEGORY_TITLE[cat]}</h2>
                {items.map((c) => (
                  <CheckCard key={c.id} c={c} />
                ))}
              </section>
            )
          })}

          {/* 최근 점검 이력 */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-700">최근 점검 이력</h2>
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-gray-400">
                    <th className="px-4 py-3 font-medium">점검 시각</th>
                    <th className="px-4 py-3 font-medium">실행</th>
                    <th className="px-4 py-3 font-medium">결과</th>
                    <th className="px-4 py-3 font-medium">정상/주의/위험</th>
                    <th className="px-4 py-3 font-medium">소요</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b last:border-0">
                      <td className="px-4 py-3 text-gray-700">{fmtKST(r.run_at)}</td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.trigger_by === 'cron' ? '자동' : '직접'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${LV[r.overall].chip}`}
                        >
                          {LV[r.overall].emoji} {LV[r.overall].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {r.ok_count} / {r.warn_count} / {r.danger_count}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {(r.duration_ms / 1000).toFixed(1)}초
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-400">
              최근 30회까지 보여줍니다. 자동 점검은 하루 1회(오후 8시대)이며, Vercel Hobby 플랜
              특성상 정확히 8시 정각이 아니라 8시~9시 사이에 실행됩니다.
            </p>
          </section>
        </>
      )}
    </div>
  )
}

function Count({ label, n, cls }: { label: string; n: number; cls: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 font-medium ${cls}`}>
      {label} {n}
    </span>
  )
}

function CheckCard({ c }: { c: CheckResult }) {
  const lv = LV[c.level]
  const isExternal = c.link?.startsWith('http')
  return (
    <div className={`rounded-xl border-l-4 bg-white p-4 shadow-sm ${lv.bar}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span>{lv.emoji}</span>
        <span className="font-semibold text-gray-800">{c.title}</span>
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${lv.chip}`}>
          {lv.label}
        </span>
        <span className="text-[11px] text-gray-300">{c.id}</span>
        {typeof c.ms === 'number' && (
          <span className="ml-auto text-[11px] text-gray-400">{c.ms}ms</span>
        )}
      </div>

      <p className="mt-2 text-sm text-gray-700">{c.summary}</p>
      {c.detail && <p className="mt-1 text-xs leading-relaxed text-gray-500">{c.detail}</p>}

      {c.samples && c.samples.length > 0 && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-gray-500 hover:text-gm-green">
            자세히 보기 ({c.samples.length}건)
          </summary>
          <ul className="mt-2 space-y-1 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
            {c.samples.map((s, i) => (
              <li key={i} className="break-all">
                · {s}
              </li>
            ))}
          </ul>
        </details>
      )}

      {c.action && (
        <div className="mt-3 rounded-lg bg-gm-cream2 p-3">
          <p className="text-xs font-semibold text-gm-green">무엇을 하면 되나요?</p>
          <p className="mt-1 text-xs leading-relaxed text-gm-body">{c.action}</p>
          {c.link &&
            (isExternal ? (
              <a
                href={c.link}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs font-medium text-gm-green underline"
              >
                바로가기 →
              </a>
            ) : (
              <Link
                href={c.link}
                className="mt-2 inline-block text-xs font-medium text-gm-green underline"
              >
                바로가기 →
              </Link>
            ))}
        </div>
      )}
    </div>
  )
}
