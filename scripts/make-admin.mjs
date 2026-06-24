// 관리자 지정: node --env-file=.env.local scripts/make-admin.mjs <아이디 또는 이름>
// 인자 없으면 이름 '주연서' 계정을 관리자로 지정.
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const arg = process.argv[2]
const { data: profiles } = await admin.from('profiles').select('id, username, name')
const target = arg
  ? profiles.find((p) => p.username === arg || p.name === arg)
  : profiles.find((p) => p.name === '주연서')

if (!target) {
  console.error('대상 계정을 찾지 못했습니다. 가입한 아이디/이름:', profiles.map((p) => `${p.name}(${p.username})`).join(', '))
  process.exit(1)
}

const { error } = await admin.from('profiles').update({ is_admin: true }).eq('id', target.id)
console.log(error ? '❌ ' + error.message : `✅ 관리자 지정 완료: ${target.name} (${target.username})`)
