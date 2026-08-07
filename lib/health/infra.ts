// A. 서버 · 인프라 안정성 점검 (읽기 전용)
import type { SupabaseClient } from '@supabase/supabase-js'
import { levelByMax, safeCheck, timed, type CheckResult, type Level, TH } from './types'

const CAT = 'infra' as const

/** 응답시간으로 신호등을 정하되, 실패하면 무조건 🔴 */
function levelByResponse(ok: boolean, ms: number, warnMs: number, dangerMs: number): Level {
  if (!ok) return 'danger'
  return levelByMax(ms, warnMs, dangerMs)
}

export async function runInfraChecks(sb: SupabaseClient): Promise<CheckResult[]> {
  const out: CheckResult[] = []

  // ---------------------------------------------------------
  // A1. Supabase 연결 상태 · 응답 시간
  // ---------------------------------------------------------
  out.push(
    await safeCheck('A1', CAT, 'Supabase 연결', async () => {
      const { value, ms } = await timed(() =>
        sb.from('settings').select('id').eq('id', 1).single()
      )
      const ok = !value.error && !!value.data
      const level = levelByResponse(ok, ms, TH.respWarnMs, TH.respDangerMs)
      return {
        id: 'A1',
        category: CAT,
        title: 'Supabase 연결',
        level,
        ms,
        summary: ok
          ? level === 'ok'
            ? `정상입니다. 응답 ${(ms / 1000).toFixed(2)}초`
            : `연결은 되지만 느립니다. 응답 ${(ms / 1000).toFixed(2)}초`
          : '데이터베이스에 연결하지 못했습니다.',
        detail: value.error ? value.error.message : `왕복 ${ms}ms`,
        action: ok
          ? level === 'ok'
            ? undefined
            : '일시적인 지연일 수 있습니다. 몇 분 뒤 다시 점검해 보고, 계속 느리면 Supabase 대시보드 > Reports에서 상태를 확인하세요.'
          : '사이트 전체가 동작하지 않는 상태일 수 있습니다. Supabase 대시보드에서 프로젝트가 일시중지(Paused)되었거나 사용량 초과가 아닌지 즉시 확인하세요.',
        link: ok ? undefined : 'https://supabase.com/dashboard',
      }
    })
  )

  // ---------------------------------------------------------
  // A2~A4. 핵심 RPC 함수 3종
  // ---------------------------------------------------------
  const rpcSpecs: {
    id: string
    fn: string
    title: string
    used: string
    validate: (d: unknown) => boolean
  }[] = [
    {
      id: 'A2',
      fn: 'challenge_stats',
      title: '집계 함수 challenge_stats',
      used: '메인페이지 "실시간 임팩트"(참여자·총 감축량·수확자)',
      validate: (d) =>
        !!d && typeof d === 'object' && 'participants' in (d as Record<string, unknown>),
    },
    {
      id: 'A3',
      fn: 'weekly_ranking',
      title: '주간 랭킹 함수 weekly_ranking',
      used: '대시보드 "이번 주 랭킹" 포디움',
      validate: (d) => Array.isArray(d),
    },
  ]

  for (const spec of rpcSpecs) {
    out.push(
      await safeCheck(spec.id, CAT, spec.title, async () => {
        const { value, ms } = await timed(() => sb.rpc(spec.fn))
        const ok = !value.error && spec.validate(value.data)
        const level = levelByResponse(ok, ms, TH.rpcWarnMs, TH.rpcDangerMs)
        return {
          id: spec.id,
          category: CAT,
          title: spec.title,
          level,
          ms,
          summary: ok
            ? level === 'ok'
              ? `정상 동작합니다. (${ms}ms)`
              : `동작하지만 느립니다. (${ms}ms)`
            : '함수가 오류를 냈거나 예상과 다른 값을 돌려줬습니다.',
          detail: value.error
            ? value.error.message
            : `${spec.used}에 사용됩니다. 응답 ${ms}ms`,
          action: ok
            ? undefined
            : `${spec.used}이(가) 화면에서 비어 보이거나 0으로 표시될 수 있습니다. Supabase SQL Editor에서 해당 마이그레이션 파일을 다시 실행해 함수를 복구하세요.`,
        }
      })
    )
  }

  // A4는 사용자 1명이 필요하므로 따로 처리
  out.push(
    await safeCheck('A4', CAT, '성장 계산 함수 effective_reduction_g', async () => {
      const { data: anyCert } = await sb
        .from('certifications')
        .select('user_id')
        .limit(1)
        .maybeSingle()

      if (!anyCert?.user_id) {
        return {
          id: 'A4',
          category: CAT,
          title: '성장 계산 함수 effective_reduction_g',
          level: 'info',
          summary: '인증 기록이 아직 없어 확인을 건너뛰었습니다.',
          detail: '인증이 1건이라도 등록되면 자동으로 점검됩니다.',
        }
      }

      const { value, ms } = await timed(() =>
        sb.rpc('effective_reduction_g', { uid: anyCert.user_id })
      )
      const ok = !value.error && value.data !== null && !Number.isNaN(Number(value.data))
      const level = levelByResponse(ok, ms, TH.rpcWarnMs, TH.rpcDangerMs)
      return {
        id: 'A4',
        category: CAT,
        title: '성장 계산 함수 effective_reduction_g',
        level,
        ms,
        summary: ok
          ? level === 'ok'
            ? `정상 동작합니다. (${ms}ms)`
            : `동작하지만 느립니다. (${ms}ms)`
          : '함수가 오류를 냈습니다.',
        detail: value.error
          ? value.error.message
          : `대시보드 작물 성장 단계 계산에 사용됩니다. 응답 ${ms}ms`,
        action: ok
          ? undefined
          : '참가자들의 작물 성장 막대가 멈춰 보일 수 있습니다. supabase/07_reduction_bonus.sql을 SQL Editor에서 다시 실행하세요.',
      }
    })
  )

  // ---------------------------------------------------------
  // A5. 인증 사진 저장소 접근
  // ---------------------------------------------------------
  out.push(
    await safeCheck('A5', CAT, '인증 사진 저장소', async () => {
      const { value, ms } = await timed(() =>
        sb.storage.from('certification-photos').list('', { limit: 1 })
      )
      const ok = !value.error
      return {
        id: 'A5',
        category: CAT,
        title: '인증 사진 저장소',
        level: ok ? 'ok' : 'danger',
        ms,
        summary: ok
          ? `정상적으로 접근됩니다. (${ms}ms)`
          : '사진 저장소에 접근하지 못했습니다.',
        detail: value.error ? value.error.message : 'certification-photos 버킷(비공개)',
        action: ok
          ? undefined
          : '관리자 인증 심사 화면에서 사진이 안 보이게 됩니다. Supabase 대시보드 > Storage에서 certification-photos 버킷이 있는지 확인하세요.',
      }
    })
  )

  // ---------------------------------------------------------
  // A6. 랜딩 이미지 저장소 (공개 버킷) — 실제 파일 1개를 HEAD로 확인
  // ---------------------------------------------------------
  out.push(
    await safeCheck('A6', CAT, '랜딩 이미지 저장소', async () => {
      const t = Date.now()
      const { data: roots, error } = await sb.storage.from('landing-images').list('', { limit: 20 })
      if (error) {
        return {
          id: 'A6',
          category: CAT,
          title: '랜딩 이미지 저장소',
          level: 'danger',
          ms: Date.now() - t,
          summary: '랜딩 이미지 저장소에 접근하지 못했습니다.',
          detail: error.message,
          action:
            '메인페이지의 소개 사진들이 깨져 보일 수 있습니다. Supabase 대시보드 > Storage에서 landing-images 버킷을 확인하세요.',
        }
      }

      // 첫 번째 실제 파일 하나를 찾아 공개 URL이 살아있는지 확인
      let sample: string | null = null
      for (const r of roots ?? []) {
        if (r.id !== null) {
          sample = r.name
          break
        }
        const { data: inner } = await sb.storage.from('landing-images').list(r.name, { limit: 5 })
        const f = (inner ?? []).find((x) => x.id !== null)
        if (f) {
          sample = `${r.name}/${f.name}`
          break
        }
      }

      if (!sample) {
        return {
          id: 'A6',
          category: CAT,
          title: '랜딩 이미지 저장소',
          level: 'warn',
          ms: Date.now() - t,
          summary: '저장소는 살아있지만 이미지 파일이 하나도 없습니다.',
          detail: 'landing-images 버킷이 비어 있음',
          action:
            '관리자 > 랜딩 내용에서 소개 섹션·재배 현장 사진을 업로드했는지 확인하세요.',
          link: '/admin/content',
        }
      }

      const { data: pub } = sb.storage.from('landing-images').getPublicUrl(sample)
      let reachable = false
      let status = 0
      try {
        const res = await fetch(pub.publicUrl, {
          method: 'HEAD',
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        })
        status = res.status
        reachable = res.ok
      } catch {
        reachable = false
      }
      const ms = Date.now() - t

      return {
        id: 'A6',
        category: CAT,
        title: '랜딩 이미지 저장소',
        level: reachable ? 'ok' : 'danger',
        ms,
        summary: reachable
          ? `정상입니다. 공개 이미지가 잘 열립니다. (${ms}ms)`
          : '이미지 파일은 있는데 인터넷에서 열리지 않습니다.',
        detail: reachable
          ? `landing-images 버킷(공개) · 확인한 파일: ${sample}`
          : `HTTP 응답 코드 ${status || '연결 실패'} · 확인한 파일: ${sample}`,
        action: reachable
          ? undefined
          : '메인페이지 사진이 깨져 보입니다. Supabase 대시보드 > Storage > landing-images 버킷이 "Public"으로 설정돼 있는지 확인하세요.',
      }
    })
  )

  // ---------------------------------------------------------
  // A7. 로그인(Auth) 서버 동작
  // ---------------------------------------------------------
  out.push(
    await safeCheck('A7', CAT, '로그인(Auth) 서버', async () => {
      const { value, ms } = await timed(() => sb.auth.admin.listUsers({ page: 1, perPage: 1 }))
      const ok = !value.error
      return {
        id: 'A7',
        category: CAT,
        title: '로그인(Auth) 서버',
        level: ok ? 'ok' : 'danger',
        ms,
        summary: ok
          ? `정상 응답합니다. (${ms}ms)`
          : '로그인 서버가 응답하지 않습니다.',
        detail: ok
          ? '계정 목록 1건만 조회하는 가벼운 확인입니다. (개인정보는 기록하지 않습니다)'
          : value.error?.message,
        action: ok
          ? undefined
          : '참가자들이 로그인·회원가입을 하지 못하는 상태일 수 있습니다. Supabase 대시보드 > Authentication에서 상태를 확인하세요.',
      }
    })
  )

  // ---------------------------------------------------------
  // A8. 필수 환경변수 (값은 절대 기록하지 않고, 있는지만 확인)
  // ---------------------------------------------------------
  out.push(
    await safeCheck('A8', CAT, '필수 환경변수', async () => {
      const required: [string, string | undefined, string][] = [
        ['NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL, '데이터베이스 주소'],
        ['NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, '공개 접속 키'],
        ['SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY, '서버 전용 비밀 키'],
        ['NEXT_PUBLIC_KAKAO_MAP_KEY', process.env.NEXT_PUBLIC_KAKAO_MAP_KEY, '카카오 지도 표시'],
        ['KAKAO_REST_API_KEY', process.env.KAKAO_REST_API_KEY, '카카오 서버 API'],
      ]
      const missing = required.filter(([, v]) => !v || !v.trim())
      const hasCronSecret = !!process.env.CRON_SECRET?.trim()

      const level: Level = missing.length > 0 ? 'danger' : hasCronSecret ? 'ok' : 'warn'
      return {
        id: 'A8',
        category: CAT,
        title: '필수 환경변수',
        level,
        summary:
          missing.length > 0
            ? `${missing.length}개가 비어 있습니다.`
            : hasCronSecret
              ? '필수 항목이 모두 설정돼 있습니다.'
              : '필수 항목은 모두 있지만 CRON_SECRET이 없습니다.',
        detail:
          missing.length > 0
            ? `없는 항목: ${missing.map(([k, , why]) => `${k}(${why})`).join(', ')}`
            : `확인한 항목 ${required.length}개 + CRON_SECRET ${hasCronSecret ? '있음' : '없음'} · 키 값 자체는 기록하지 않습니다.`,
        action:
          missing.length > 0
            ? 'Vercel 대시보드 > 프로젝트 > Settings > Environment Variables에서 빠진 항목을 Production에 추가한 뒤 다시 배포하세요.'
            : hasCronSecret
              ? undefined
              : 'CRON_SECRET이 없으면 매일 자동 점검이 401 오류로 실패합니다. Vercel > Settings > Environment Variables에 무작위 문자열(16자 이상)로 추가하세요.',
      }
    })
  )

  // ---------------------------------------------------------
  // A9. 배포 버전 (참고 정보)
  // ---------------------------------------------------------
  out.push(
    await safeCheck('A9', CAT, '현재 배포 버전', async () => {
      const sha = process.env.VERCEL_GIT_COMMIT_SHA ?? null
      const env = process.env.VERCEL_ENV ?? null
      const msg = process.env.VERCEL_GIT_COMMIT_MESSAGE ?? null
      const branch = process.env.VERCEL_GIT_COMMIT_REF ?? null

      return {
        id: 'A9',
        category: CAT,
        title: '현재 배포 버전',
        level: 'info',
        summary: sha
          ? `${env === 'production' ? '운영' : (env ?? '로컬')} · 커밋 ${sha.slice(0, 7)}`
          : '로컬 실행 중이라 배포 정보가 없습니다.',
        detail: sha
          ? [branch && `브랜치 ${branch}`, msg && `"${msg.split('\n')[0].slice(0, 80)}"`]
              .filter(Boolean)
              .join(' · ')
          : 'Vercel에 배포된 상태에서만 커밋 정보가 표시됩니다.',
      }
    })
  )

  return out
}
