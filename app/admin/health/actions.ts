'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { runHealthCheck } from '@/lib/health/run'

/** 관리자 화면의 [지금 전체 점검 실행] 버튼이 부르는 함수 */
export async function runHealthNow(): Promise<{ error: string } | { ok: true }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile?.is_admin) return { error: '관리자만 실행할 수 있습니다.' }

  try {
    await runHealthCheck('manual')
  } catch (e) {
    return { error: e instanceof Error ? e.message : '점검 실행에 실패했습니다.' }
  }

  revalidatePath('/admin/health')
  return { ok: true }
}
