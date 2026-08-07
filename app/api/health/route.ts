// 상태 점검 실행 API
//
// 두 가지 방법으로만 실행할 수 있습니다.
//  1) Vercel Cron — 매일 1회. CRON_SECRET 환경변수를 만들어두면 Vercel이
//     Authorization: Bearer <CRON_SECRET> 헤더를 자동으로 붙여 보냅니다.
//  2) 로그인한 관리자(is_admin) — 브라우저에서 직접 열어볼 때.
// 그 외 요청은 401로 막습니다.
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runHealthCheck } from '@/lib/health/run'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 초 (Hobby 플랜 상한 300초 이내)

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')
  const isCron = !!secret && authHeader === `Bearer ${secret}`

  let isAdmin = false
  if (!isCron) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle()
      isAdmin = !!profile?.is_admin
    }
  }

  if (!isCron && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const report = await runHealthCheck(isCron ? 'cron' : 'manual')

  return NextResponse.json(report, {
    status: report.overall === 'danger' ? 500 : 200,
    headers: { 'Cache-Control': 'no-store' },
  })
}
