// B. 데이터 무결성 점검 (읽기 전용 — 문제를 "발견·보고"만 하고 고치지 않습니다)
import { EMISSION_COLUMN, TRANSPORT_LABEL, type TransportKey } from '@/lib/transport'
import { extractLandingPath, type HealthContext } from './context'
import { fmtBytes, levelByMax, safeCheck, type CheckResult, type Level, TH } from './types'

const CAT = 'integrity' as const

const num = (v: unknown) => Number(v ?? 0)
const DAY = 24 * 60 * 60 * 1000

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / DAY)
}

export async function runIntegrityChecks(ctx: HealthContext): Promise<CheckResult[]> {
  const out: CheckResult[] = []
  const { certs, profiles, settings } = ctx
  const approved = certs.filter((c) => c.status === 'approved')

  // ---------------------------------------------------------
  // B1. 주인이 사라진 인증 (탈퇴 회원의 기록이 남았는지)
  // ---------------------------------------------------------
  out.push(
    await safeCheck('B1', CAT, '주인 없는 인증 기록', async () => {
      const ids = new Set(profiles.map((p) => p.id))
      const orphans = certs.filter((c) => !ids.has(c.user_id))
      return {
        id: 'B1',
        category: CAT,
        title: '주인 없는 인증 기록',
        level: orphans.length > 0 ? 'danger' : 'ok',
        summary:
          orphans.length > 0
            ? `회원 정보가 없는 인증이 ${orphans.length}건 있습니다.`
            : '모든 인증이 실제 회원과 연결돼 있습니다.',
        detail: `인증 ${certs.length}건 / 회원 ${profiles.length}명 대조`,
        samples: orphans.slice(0, 20).map((c) => `인증 ${c.id} → 없는 회원 ${c.user_id}`),
        action:
          orphans.length > 0
            ? '정상이라면 생길 수 없는 상태입니다(회원 삭제 시 인증도 함께 지워짐). 통계가 어긋날 수 있으니 내용을 알려주시면 원인을 확인하겠습니다.'
            : undefined,
      }
    })
  )

  // ---------------------------------------------------------
  // B2. 사진 4장 규칙
  // ---------------------------------------------------------
  out.push(
    await safeCheck('B2', CAT, '인증 사진 4장 규칙', async () => {
      const shortage = certs
        .map((c) => ({
          c,
          n: [c.start_photo_1, c.start_photo_2, c.end_photo_1, c.end_photo_2].filter(Boolean)
            .length,
        }))
        .filter((x) => x.n < 4)
      const inApproved = shortage.filter((x) => x.c.status === 'approved')
      const level: Level =
        inApproved.length > 0 ? 'danger' : shortage.length > 0 ? 'warn' : 'ok'
      return {
        id: 'B2',
        category: CAT,
        title: '인증 사진 4장 규칙',
        level,
        summary:
          shortage.length === 0
            ? `${certs.length}건 모두 사진 4장을 갖추고 있습니다.`
            : `사진이 4장이 안 되는 인증이 ${shortage.length}건 있습니다. (그중 승인 상태 ${inApproved.length}건)`,
        detail: '한 동선 = 시작 2장 + 종료 2장 = 총 4장',
        samples: shortage.slice(0, 20).map((x) => `인증 ${x.c.id} — 사진 ${x.n}장 (${x.c.status})`),
        action:
          level === 'danger'
            ? '승인된 인증인데 사진이 부족합니다. 관리자 > 인증 내역에서 해당 건을 확인해 반려할지 판단하세요.'
            : level === 'warn'
              ? '반려된 건에만 해당하므로 급하지 않습니다. 참고만 하세요.'
              : undefined,
        link: level !== 'ok' ? '/admin/certifications' : undefined,
      }
    })
  )

  // ---------------------------------------------------------
  // B3. DB에는 있는데 실제 파일이 없는 사진
  // ---------------------------------------------------------
  out.push(
    await safeCheck('B3', CAT, '사진 파일 실제 존재 여부', async () => {
      if (!ctx.photoAudit) {
        return {
          id: 'B3',
          category: CAT,
          title: '사진 파일 실제 존재 여부',
          level: 'warn',
          summary: '대조용 함수를 실행하지 못했습니다.',
          detail: ctx.photoAuditError ?? '알 수 없는 오류',
          action:
            'supabase/11_health_logs.sql을 Supabase SQL Editor에서 실행했는지 확인하세요. (health_photo_audit 함수가 필요합니다)',
        }
      }
      const a = ctx.photoAudit
      const level = levelByMax(a.missing_count, TH.missingPhotoWarn, TH.missingPhotoDanger)
      return {
        id: 'B3',
        category: CAT,
        title: '사진 파일 실제 존재 여부',
        level,
        summary:
          a.missing_count === 0
            ? `기록된 사진 ${a.db_paths}장이 모두 실제로 저장돼 있습니다.`
            : `${a.missing_count}장이 기록에만 있고 실제 파일이 없습니다.`,
        detail: `DB 기록 ${a.db_paths}장 / 저장소 파일 ${a.storage_files}개`,
        samples: a.missing_samples ?? [],
        action:
          a.missing_count > 0
            ? '해당 인증은 심사 화면에서 사진이 깨져 보입니다. 참가자에게 재등록을 안내하거나, 사진 없이 판단이 어려우면 반려를 검토하세요. (파일은 복구할 수 없습니다)'
            : undefined,
        link: a.missing_count > 0 ? '/admin/certifications' : undefined,
      }
    })
  )

  // ---------------------------------------------------------
  // B4. 음수 · 0 이하 이상값
  // ---------------------------------------------------------
  out.push(
    await safeCheck('B4', CAT, '음수·0 이상값', async () => {
      const bad = certs.filter((c) => num(c.distance_km) <= 0 || num(c.co2_reduced_g) < 0)
      return {
        id: 'B4',
        category: CAT,
        title: '음수·0 이상값',
        level: bad.length > 0 ? 'danger' : 'ok',
        summary:
          bad.length > 0
            ? `거리 또는 감축량이 비정상인 인증이 ${bad.length}건 있습니다.`
            : '거리·감축량이 모두 정상 범위입니다.',
        detail: '거리 0 이하 또는 감축량 음수인 기록을 찾습니다.',
        samples: bad
          .slice(0, 20)
          .map((c) => `인증 ${c.id} — 거리 ${c.distance_km}km / 감축 ${c.co2_reduced_g}g`),
        action:
          bad.length > 0
            ? '총 감축량 집계가 어긋납니다. 관리자 > 인증 내역에서 해당 건의 거리를 수정하거나 반려하세요.'
            : undefined,
        link: bad.length > 0 ? '/admin/certifications' : undefined,
      }
    })
  )

  // ---------------------------------------------------------
  // B5. 비정상적으로 먼 거리 (승인된 인증만)
  // ---------------------------------------------------------
  out.push(
    await safeCheck('B5', CAT, '비정상적으로 먼 이동거리', async () => {
      const flagged = approved
        .map((c) => {
          const th = TH.distance[c.transport] ?? { warn: 50, danger: 100 }
          const d = num(c.distance_km)
          const lv: Level = d >= th.danger ? 'danger' : d >= th.warn ? 'warn' : 'ok'
          return { c, d, lv }
        })
        .filter((x) => x.lv !== 'ok')
      const dangers = flagged.filter((x) => x.lv === 'danger')
      const level: Level = dangers.length > 0 ? 'danger' : flagged.length > 0 ? 'warn' : 'ok'
      const thText = Object.entries(TH.distance)
        .map(([k, v]) => `${TRANSPORT_LABEL[k as TransportKey] ?? k} ${v.warn}/${v.danger}km`)
        .join(', ')
      return {
        id: 'B5',
        category: CAT,
        title: '비정상적으로 먼 이동거리',
        level,
        summary:
          flagged.length === 0
            ? `승인된 인증 ${approved.length}건 모두 상식적인 거리입니다.`
            : `확인이 필요한 인증이 ${flagged.length}건 있습니다. (그중 ${dangers.length}건은 매우 이례적)`,
        detail: `기준(주의/위험): ${thText} · 반려된 건은 제외합니다.`,
        samples: flagged
          .slice(0, 20)
          .map(
            (x) =>
              `${x.lv === 'danger' ? '🔴' : '🟡'} ${TRANSPORT_LABEL[x.c.transport as TransportKey] ?? x.c.transport} ${x.d}km — 인증 ${x.c.id}`
          ),
        action:
          flagged.length > 0
            ? '실제로 그만큼 이동한 게 맞는지 확인하세요. 관리자 > 인증 내역에서 [승인] 버튼을 눌러 이동거리를 올바른 값으로 수정하면 감축량도 자동으로 다시 계산됩니다.'
            : undefined,
        link: flagged.length > 0 ? '/admin/certifications' : undefined,
      }
    })
  )

  // ---------------------------------------------------------
  // B6. CO₂ 계산값 일치 (배출계수 변경 이력을 감안)
  // ---------------------------------------------------------
  out.push(
    await safeCheck('B6', CAT, 'CO₂ 계산값 일치', async () => {
      if (!settings) throw new Error('설정값을 읽지 못했습니다.')
      const car = num(settings.car_emission)
      const changedAt = new Date(settings.updated_at).getTime()

      const mismatched = certs
        .map((c) => {
          const col = EMISSION_COLUMN[c.transport as TransportKey]
          if (!col) return null
          const mode = num((settings as unknown as Record<string, unknown>)[col])
          const expected = Math.max(0, Math.round((car - mode) * num(c.distance_km) * 100) / 100)
          const gap = Math.abs(expected - num(c.co2_reduced_g))
          if (gap <= 0.01) return null
          return { c, expected, gap, afterChange: new Date(c.created_at).getTime() > changedAt }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)

      const after = mismatched.filter((x) => x.afterChange)
      const before = mismatched.filter((x) => !x.afterChange)
      const level: Level = after.length > 0 ? 'danger' : before.length > 0 ? 'warn' : 'ok'

      return {
        id: 'B6',
        category: CAT,
        title: 'CO₂ 계산값 일치',
        level,
        summary:
          level === 'ok'
            ? '모든 인증의 감축량이 현재 배출계수와 일치합니다.'
            : after.length > 0
              ? `계수를 바꾼 뒤에 등록된 인증 ${after.length}건의 감축량이 계산식과 다릅니다.`
              : `${before.length}건이 예전 배출계수로 계산돼 있습니다. (정상적인 이력입니다)`,
        detail: `계산식: (승용차 ${car} − 수단계수) × 거리(km) · 배출계수 최종 변경 ${new Date(settings.updated_at).toLocaleString('ko-KR')}`,
        samples: mismatched
          .slice(0, 20)
          .map(
            (x) =>
              `${x.afterChange ? '🔴 변경 후' : '🟡 변경 전'} ${TRANSPORT_LABEL[x.c.transport as TransportKey] ?? x.c.transport} ${x.c.distance_km}km — 저장 ${x.c.co2_reduced_g}g / 현재식 ${x.expected}g`
          ),
        action:
          after.length > 0
            ? '계수 변경 이후 등록된 건인데 값이 다릅니다. 계산 로직 문제일 수 있으니 위 사례를 알려주세요.'
            : before.length > 0
              ? '조치할 필요 없습니다. 배출계수를 바꾸기 전에 등록된 인증은 그 당시 계수로 저장되어 있어 정상입니다. (과거 기록을 소급해 바꾸지 않는 것이 원칙)'
              : undefined,
      }
    })
  )

  // ---------------------------------------------------------
  // B7. 집계 일관성 (직접 계산 ↔ challenge_stats 함수)
  // ---------------------------------------------------------
  out.push(
    await safeCheck('B7', CAT, '집계 수치 일관성', async () => {
      if (!ctx.challengeStats) {
        return {
          id: 'B7',
          category: CAT,
          title: '집계 수치 일관성',
          level: 'danger',
          summary: 'challenge_stats 함수를 호출하지 못해 대조할 수 없습니다.',
          action: 'A2 항목(집계 함수)의 안내를 먼저 확인하세요.',
        }
      }
      const targetKg = num(settings?.target_co2_kg ?? 5)
      const perUser = new Map<string, number>()
      for (const c of approved)
        perUser.set(c.user_id, (perUser.get(c.user_id) ?? 0) + num(c.co2_reduced_g))
      const mine = {
        participants: perUser.size,
        total_reduced_kg:
          Array.from(perUser.values()).reduce((s, g) => s + g, 0) / 1000,
        harvest_count: Array.from(perUser.values()).filter((g) => g / 1000 >= targetKg).length,
      }
      const rpc = ctx.challengeStats
      const diffs: string[] = []
      if (mine.participants !== Number(rpc.participants))
        diffs.push(`참여자 직접계산 ${mine.participants}명 ↔ 함수 ${rpc.participants}명`)
      if (Math.abs(mine.total_reduced_kg - Number(rpc.total_reduced_kg)) > 0.001)
        diffs.push(
          `총 감축량 직접계산 ${mine.total_reduced_kg.toFixed(3)}kg ↔ 함수 ${Number(rpc.total_reduced_kg).toFixed(3)}kg`
        )
      if (mine.harvest_count !== Number(rpc.harvest_count))
        diffs.push(`수확자 직접계산 ${mine.harvest_count}명 ↔ 함수 ${rpc.harvest_count}명`)

      return {
        id: 'B7',
        category: CAT,
        title: '집계 수치 일관성',
        level: diffs.length > 0 ? 'danger' : 'ok',
        summary:
          diffs.length > 0
            ? `메인페이지에 보이는 숫자와 실제 데이터가 ${diffs.length}곳 다릅니다.`
            : '메인페이지 숫자와 실제 데이터가 정확히 일치합니다.',
        detail: `참여자 ${rpc.participants}명 · 총 감축 ${Number(rpc.total_reduced_kg).toFixed(2)}kg · 수확 ${rpc.harvest_count}명 (목표 ${targetKg}kg)`,
        samples: diffs,
        action:
          diffs.length > 0
            ? '방문자에게 잘못된 숫자가 보이는 상태입니다. supabase/05_public_stats.sql을 SQL Editor에서 다시 실행해 함수를 최신으로 맞추세요.'
            : undefined,
      }
    })
  )

  // ---------------------------------------------------------
  // B8. 아직 확인하지 않은 인증 (자동승인 + 사후검토 구조)
  // ---------------------------------------------------------
  out.push(
    await safeCheck('B8', CAT, '미검토 인증 방치', async () => {
      const unreviewed = certs.filter((c) => c.status === 'approved' && !c.processed_at)
      const ages = unreviewed.map((c) => daysSince(c.created_at))
      const oldest = ages.length ? Math.max(...ages) : 0
      const level = ages.length
        ? levelByMax(oldest, TH.unreviewedWarnDays, TH.unreviewedDangerDays)
        : 'ok'
      return {
        id: 'B8',
        category: CAT,
        title: '미검토 인증 방치',
        level,
        summary:
          unreviewed.length === 0
            ? '운영진이 모든 인증을 확인했습니다.'
            : `아직 확인하지 않은 인증이 ${unreviewed.length}건 있습니다. (가장 오래된 것 ${oldest}일 경과)`,
        detail:
          '이 사이트는 "자동 승인 + 운영진 사후 검토" 방식이라, 등록 직후에는 모두 미검토 상태입니다. 며칠씩 쌓이는지를 봅니다.',
        samples: unreviewed
          .slice(0, 20)
          .map(
            (c) =>
              `${daysSince(c.created_at)}일 경과 — ${TRANSPORT_LABEL[c.transport as TransportKey] ?? c.transport} ${c.distance_km}km (인증 ${c.id})`
          ),
        action:
          level === 'ok'
            ? undefined
            : `관리자 > 인증 내역에서 오래된 건부터 확인해 주세요. ${TH.unreviewedDangerDays}일이 넘으면 부정 인증을 되돌리기 어려워집니다.`,
        link: level === 'ok' ? undefined : '/admin/certifications',
      }
    })
  )

  // ---------------------------------------------------------
  // B9. 거리 수정 이력 정합성
  // ---------------------------------------------------------
  out.push(
    await safeCheck('B9', CAT, '거리 수정 이력 정합성', async () => {
      const problems: string[] = []
      let editedCount = 0
      for (const c of certs) {
        const hasOriginal = c.original_distance_km !== null && c.original_distance_km !== undefined
        const marks = [c.distance_edit_reason, c.distance_edited_by, c.distance_edited_at]
        const markCount = marks.filter((m) => m !== null && m !== undefined && m !== '').length
        if (hasOriginal) editedCount++
        if (hasOriginal && markCount < 3)
          problems.push(`인증 ${c.id} — 수정 기록은 있는데 사유·수정자·시각 중 ${3 - markCount}개가 비어 있음`)
        if (!hasOriginal && markCount > 0)
          problems.push(`인증 ${c.id} — 수정 흔적은 있는데 원래 거리(original_distance_km)가 없음`)
        if (hasOriginal && num(c.original_distance_km) <= 0)
          problems.push(`인증 ${c.id} — 원래 거리가 ${c.original_distance_km}km로 비정상`)
      }
      return {
        id: 'B9',
        category: CAT,
        title: '거리 수정 이력 정합성',
        level: problems.length > 0 ? 'warn' : 'ok',
        summary:
          problems.length > 0
            ? `거리 수정 기록이 불완전한 인증이 ${problems.length}건 있습니다.`
            : editedCount > 0
              ? `거리를 수정한 인증 ${editedCount}건 모두 기록이 완전합니다.`
              : '거리를 수정한 인증이 없습니다.',
        detail: '거리를 고치면 원래 거리·사유·수정자·시각 4가지가 함께 남아야 합니다.',
        samples: problems.slice(0, 20),
        action:
          problems.length > 0
            ? '기록이 남지 않은 수정이 있다는 뜻입니다. 감사 자료로 쓰기 어려우니 위 사례를 알려주시면 원인을 확인하겠습니다.'
            : undefined,
      }
    })
  )

  // ---------------------------------------------------------
  // B10. 설정값(settings) 유효성
  // ---------------------------------------------------------
  out.push(
    await safeCheck('B10', CAT, '설정값 유효성', async () => {
      if (!settings) throw new Error('설정값을 읽지 못했습니다.')
      const danger: string[] = []
      const warn: string[] = []
      const car = num(settings.car_emission)

      if (num(settings.target_co2_kg) <= 0) danger.push('목표 감축량이 0 이하입니다.')
      if (settings.challenge_start && settings.challenge_end) {
        if (new Date(settings.challenge_start) >= new Date(settings.challenge_end))
          danger.push('챌린지 시작일이 종료일보다 늦거나 같습니다.')
      } else {
        warn.push('챌린지 시작일 또는 종료일이 비어 있습니다.')
      }
      for (const t of ['walk', 'bike', 'bus', 'subway'] as TransportKey[]) {
        const v = num((settings as unknown as Record<string, unknown>)[EMISSION_COLUMN[t]])
        if (v >= car)
          danger.push(
            `${TRANSPORT_LABEL[t]} 계수(${v})가 승용차 계수(${car}) 이상이라 감축량이 0이 됩니다.`
          )
      }
      const bus = num(settings.bus_emission)
      const subway = num(settings.subway_emission)
      if (Math.abs(bus - subway) < 5)
        warn.push(
          `버스(${bus})와 지하철(${subway}) 계수가 거의 같습니다. 의도한 값인지 확인해 보세요.`
        )

      const level: Level = danger.length > 0 ? 'danger' : warn.length > 0 ? 'warn' : 'ok'
      return {
        id: 'B10',
        category: CAT,
        title: '설정값 유효성',
        level,
        summary:
          level === 'ok'
            ? '목표·일정·배출계수 설정이 모두 정상입니다.'
            : `확인이 필요한 설정이 ${danger.length + warn.length}건 있습니다.`,
        detail: `목표 ${settings.target_co2_kg}kg · 기간 ${settings.challenge_start} ~ ${settings.challenge_end} · 승용차 ${car} / 걷기 ${settings.walk_emission} / 자전거 ${settings.bike_emission} / 버스 ${bus} / 지하철 ${subway} (g per km)`,
        samples: [...danger.map((d) => `🔴 ${d}`), ...warn.map((w) => `🟡 ${w}`)],
        action: level === 'ok' ? undefined : '관리자 > 설정에서 값을 확인하고 필요하면 수정하세요.',
        link: level === 'ok' ? undefined : '/admin/settings',
      }
    })
  )

  // ---------------------------------------------------------
  // B11. 주인 없는 사진 파일 (용량 낭비)
  // ---------------------------------------------------------
  out.push(
    await safeCheck('B11', CAT, '주인 없는 사진 파일', async () => {
      if (!ctx.photoAudit) {
        return {
          id: 'B11',
          category: CAT,
          title: '주인 없는 사진 파일',
          level: 'warn',
          summary: '대조용 함수를 실행하지 못했습니다.',
          detail: ctx.photoAuditError ?? '알 수 없는 오류',
          action: 'supabase/11_health_logs.sql을 Supabase SQL Editor에서 실행하세요.',
        }
      }
      const a = ctx.photoAudit
      const level: Level = a.orphan_count >= TH.orphanFileWarn ? 'warn' : 'ok'
      return {
        id: 'B11',
        category: CAT,
        title: '주인 없는 사진 파일',
        level,
        summary:
          a.orphan_count === 0
            ? '저장소의 모든 파일이 실제 인증에 연결돼 있습니다.'
            : `어떤 인증에도 연결되지 않은 파일이 ${a.orphan_count}개 있습니다. (${fmtBytes(a.orphan_bytes)})`,
        detail:
          '업로드는 됐지만 인증 등록이 중간에 실패한 경우 등에 생깁니다. 사이트 동작에는 문제가 없고 저장 용량만 차지합니다.',
        samples: a.orphan_samples ?? [],
        action:
          a.orphan_count > 0
            ? '급하지 않습니다. 용량이 부담될 때 정리하면 되고, 삭제는 되돌릴 수 없으니 별도로 말씀해 주시면 목록을 만들어 드리겠습니다. (이 점검은 절대 파일을 지우지 않습니다)'
            : undefined,
      }
    })
  )

  // ---------------------------------------------------------
  // B12. 메인페이지 이미지 링크 (깨진 사진 예방)
  // ---------------------------------------------------------
  out.push(
    await safeCheck('B12', CAT, '메인페이지 이미지 링크', async () => {
      const targets = [
        ...ctx.landingImageUrls.map((u) => ({ where: '소개 섹션', url: u })),
        ...ctx.siteImageUrls.map((s) => ({ where: s.key, url: s.url })),
      ]
      if (targets.length === 0) {
        return {
          id: 'B12',
          category: CAT,
          title: '메인페이지 이미지 링크',
          level: 'info',
          summary: '메인페이지에 등록된 이미지가 없습니다.',
          detail: '관리자 > 랜딩 내용에서 이미지를 올리면 이 항목이 점검됩니다.',
        }
      }

      // landing-images 버킷의 실제 파일 목록 (1단계 하위 폴더까지)
      const existing = new Set<string>()
      const { data: roots } = await ctx.sb.storage.from('landing-images').list('', { limit: 1000 })
      for (const r of roots ?? []) {
        if (r.id !== null) existing.add(r.name)
        else {
          const { data: inner } = await ctx.sb.storage
            .from('landing-images')
            .list(r.name, { limit: 1000 })
          for (const f of inner ?? []) if (f.id !== null) existing.add(`${r.name}/${f.name}`)
        }
      }

      const broken: string[] = []
      for (const t of targets) {
        const path = extractLandingPath(t.url)
        if (!path) {
          broken.push(`${t.where} — 주소 형식을 알 수 없음 (${t.url.slice(0, 60)})`)
          continue
        }
        if (!existing.has(path)) broken.push(`${t.where} — 파일 없음 (${path})`)
      }

      return {
        id: 'B12',
        category: CAT,
        title: '메인페이지 이미지 링크',
        level: broken.length > 0 ? 'danger' : 'ok',
        summary:
          broken.length === 0
            ? `메인페이지 이미지 ${targets.length}장이 모두 정상적으로 연결돼 있습니다.`
            : `방문자에게 깨져 보이는 이미지가 ${broken.length}장 있습니다.`,
        detail: `점검 대상 ${targets.length}장 · 저장소 파일 ${existing.size}개`,
        samples: broken.slice(0, 20),
        action:
          broken.length > 0
            ? '메인페이지에서 사진이 엑스박스로 보이는 상태입니다. 관리자 > 랜딩 내용에서 해당 이미지를 다시 업로드하세요.'
            : undefined,
        link: broken.length > 0 ? '/admin/content' : undefined,
      }
    })
  )

  // ---------------------------------------------------------
  // B13. 회원 정보 이상 (실물 작물 배송 사고 예방)
  // ---------------------------------------------------------
  out.push(
    await safeCheck('B13', CAT, '회원 정보 이상', async () => {
      const seen = new Map<string, number>()
      for (const p of profiles) {
        const u = (p.username ?? '').trim().toLowerCase()
        if (u) seen.set(u, (seen.get(u) ?? 0) + 1)
      }
      const dupes = Array.from(seen.entries()).filter(([, n]) => n > 1)

      const certUserIds = new Set(approved.map((c) => c.user_id))
      const incomplete = profiles
        .filter((p) => certUserIds.has(p.id)) // 실제 참여자만 (가입만 한 사람 제외)
        .filter((p) => !p.name?.trim() || !p.phone?.trim() || !p.address?.trim() || !p.email?.trim())

      const level: Level = dupes.length > 0 ? 'danger' : incomplete.length > 0 ? 'warn' : 'ok'
      return {
        id: 'B13',
        category: CAT,
        title: '회원 정보 이상',
        level,
        summary:
          level === 'ok'
            ? `참여자 ${certUserIds.size}명의 연락처·주소가 모두 채워져 있습니다.`
            : dupes.length > 0
              ? `아이디가 중복된 회원이 ${dupes.length}건 있습니다.`
              : `배송 정보가 빠진 참여자가 ${incomplete.length}명 있습니다.`,
        detail: `전체 가입 ${profiles.length}명 중 인증 참여자 ${certUserIds.size}명을 대상으로 확인`,
        samples: [
          ...dupes.map(([u, n]) => `🔴 아이디 "${u}" 가 ${n}개 계정에 중복`),
          ...incomplete.slice(0, 20).map((p) => {
            const miss = [
              !p.name?.trim() && '이름',
              !p.phone?.trim() && '연락처',
              !p.address?.trim() && '주소',
              !p.email?.trim() && '이메일',
            ].filter(Boolean)
            return `🟡 ${p.username ?? p.id} — ${miss.join('·')} 없음`
          }),
        ],
        action:
          level === 'ok'
            ? undefined
            : dupes.length > 0
              ? '아이디는 중복될 수 없게 돼 있어 정상이라면 생기지 않는 상태입니다. 로그인 오류가 날 수 있으니 알려주세요.'
              : '실물 작물을 보낼 때 문제가 됩니다. 관리자 > 참가자 명부에서 확인하고 해당 참가자에게 정보를 요청하세요.',
        link: level === 'ok' ? undefined : '/admin/participants',
      }
    })
  )

  // ---------------------------------------------------------
  // B14. 챌린지 일정 상태
  // ---------------------------------------------------------
  out.push(
    await safeCheck('B14', CAT, '챌린지 일정 상태', async () => {
      const end = settings?.challenge_end ? new Date(`${settings.challenge_end}T23:59:59+09:00`) : null
      const start = settings?.challenge_start ? new Date(`${settings.challenge_start}T00:00:00+09:00`) : null
      if (!end || !start) {
        return {
          id: 'B14',
          category: CAT,
          title: '챌린지 일정 상태',
          level: 'warn',
          summary: '챌린지 일정이 설정돼 있지 않습니다.',
          action: '관리자 > 설정에서 시작일·종료일을 입력하세요.',
          link: '/admin/settings',
        }
      }
      const now = Date.now()
      const dday = Math.ceil((end.getTime() - now) / DAY)
      const afterEnd = certs.filter((c) => new Date(c.created_at).getTime() > end.getTime())
      const level: Level = afterEnd.length > 0 ? 'warn' : 'info'
      return {
        id: 'B14',
        category: CAT,
        title: '챌린지 일정 상태',
        level,
        summary:
          now > end.getTime()
            ? `챌린지가 ${Math.abs(dday)}일 전에 종료됐습니다.`
            : now < start.getTime()
              ? `챌린지 시작까지 ${Math.ceil((start.getTime() - now) / DAY)}일 남았습니다.`
              : `챌린지 진행 중 · 종료까지 D-${dday}`,
        detail: `${settings?.challenge_start} ~ ${settings?.challenge_end} (한국시간 기준)`,
        samples:
          afterEnd.length > 0
            ? [`종료일 이후 등록된 인증 ${afterEnd.length}건`]
            : undefined,
        action:
          afterEnd.length > 0
            ? '종료일이 지났는데도 인증이 들어오고 있습니다. 의도한 것이라면 관리자 > 설정에서 종료일을 늘리고, 아니라면 해당 인증을 집계에 포함할지 결정하세요.'
            : undefined,
        link: afterEnd.length > 0 ? '/admin/settings' : undefined,
      }
    })
  )

  return out
}
