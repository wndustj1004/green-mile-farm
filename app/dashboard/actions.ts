'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkName } from '@/lib/validation'

export async function logoutAction() {
  const supabase = createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

const CHANGE_COOLDOWN_DAYS = 10

// 이름 변경 — 본인만, 10일에 한 번. '이름'만 갱신(서비스롤).
export async function changeName(
  newName: string
): Promise<{ error: string } | { ok: true; name: string }> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const err = checkName(newName)
  if (err) return { error: err }
  const trimmed = newName.trim()

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, name_changed_at')
    .eq('id', user.id)
    .single()

  if (profile?.name === trimmed) return { error: '기존 이름과 동일합니다.' }

  if (profile?.name_changed_at) {
    const days = (Date.now() - new Date(profile.name_changed_at).getTime()) / 86400000
    if (days < CHANGE_COOLDOWN_DAYS) {
      const remain = Math.ceil(CHANGE_COOLDOWN_DAYS - days)
      return { error: `이름은 ${CHANGE_COOLDOWN_DAYS}일에 한 번만 변경할 수 있어요. ${remain}일 후에 다시 시도해주세요.` }
    }
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ name: trimmed, name_changed_at: new Date().toISOString() })
    .eq('id', user.id)
  if (error) return { error: '변경 실패: ' + error.message }

  revalidatePath('/dashboard')
  revalidatePath('/my')
  revalidatePath('/admin/participants')
  revalidatePath('/admin')
  return { ok: true, name: trimmed }
}
