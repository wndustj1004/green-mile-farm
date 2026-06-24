import { createClient } from '@/lib/supabase/server'

function cell(v: unknown): string {
  const s = String(v ?? '')
  // 쉼표·따옴표·줄바꿈이 있으면 따옴표로 감싸고 내부 따옴표는 두 번
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET() {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized', { status: 401 })
  const { data: me } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!me?.is_admin) return new Response('Forbidden', { status: 403 })

  const { data: settings } = await supabase.from('settings').select('target_co2_kg').eq('id', 1).single()
  const targetKg = Number(settings?.target_co2_kg ?? 5)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, name, username, phone, email, address, created_at')
    .order('created_at', { ascending: true })

  const { data: certs } = await supabase
    .from('certifications')
    .select('user_id, distance_km, co2_reduced_g, status')
    .eq('status', 'approved')

  const agg = new Map<string, { count: number; dist: number; g: number }>()
  for (const c of certs ?? []) {
    const a = agg.get(c.user_id) ?? { count: 0, dist: 0, g: 0 }
    a.count++
    a.dist += Number(c.distance_km)
    a.g += Number(c.co2_reduced_g)
    agg.set(c.user_id, a)
  }

  const header = ['이름', '아이디', '핸드폰', '이메일', '주소', '인증횟수', '누적거리(km)', '누적감축(kg)', '수확달성']
  const rows = (profiles ?? []).map((p) => {
    const a = agg.get(p.id) ?? { count: 0, dist: 0, g: 0 }
    const kg = a.g / 1000
    return [
      p.name,
      p.username,
      p.phone,
      p.email,
      p.address,
      a.count,
      a.dist.toFixed(1),
      kg.toFixed(2),
      kg >= targetKg ? 'O' : '',
    ]
  })

  // BOM(﻿): 엑셀에서 한글이 깨지지 않게 함
  const csv = '﻿' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n')

  const date = new Date().toISOString().slice(0, 10)
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="greenmile_participants_${date}.csv"`,
    },
  })
}
