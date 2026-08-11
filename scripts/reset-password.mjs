// 운영진(관리자)이 특정 계정의 비밀번호를 강제로 바꿔주는 도구.
// 사용법: node --env-file=.env.local scripts/reset-password.mjs <아이디> <새비밀번호>
//   예)  node --env-file=.env.local scripts/reset-password.mjs <관리자아이디> newpass1234
//
// ※ 참가자는 사이트에서 스스로 바꿀 수 있습니다(/login/find).
//   이 스크립트는 ① 운영진 본인 계정(사이트에서는 막혀 있음)이나
//   ② 가입정보를 기억 못 해 본인확인을 못 하는 참가자를 도울 때 씁니다.
import { createClient } from '@supabase/supabase-js'

const username = process.argv[2]
const password = process.argv[3]

if (!username || !password) {
  console.error('사용법: node --env-file=.env.local scripts/reset-password.mjs <아이디> <새비밀번호>')
  process.exit(1)
}
if (password.length < 8) {
  console.error('❌ 비밀번호는 8자 이상이어야 합니다.')
  process.exit(1)
}

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const { data: profile, error: readErr } = await admin
  .from('profiles')
  .select('id, username, name, email, is_admin')
  .eq('username', username)
  .maybeSingle()

if (readErr) {
  console.error('❌ 회원 정보를 읽지 못했습니다: ' + readErr.message)
  process.exit(1)
}
if (!profile) {
  console.error(`❌ '${username}' 아이디를 가진 회원이 없습니다.`)
  process.exit(1)
}

const { error } = await admin.auth.admin.updateUserById(profile.id, { password })
if (error) {
  console.error('❌ 비밀번호 변경 실패: ' + error.message)
  process.exit(1)
}

// 혹시 발급돼 있던 재설정 열쇠는 무효화
await admin.from('password_reset_tokens').delete().eq('user_id', profile.id)

console.log(`✅ 비밀번호를 변경했습니다.`)
console.log(`   아이디 ${profile.username} / 이름 ${profile.name} / 이메일 ${profile.email}${profile.is_admin ? ' (운영진)' : ''}`)
console.log(`   본인에게 새 비밀번호를 안전한 경로로 전달하고, 로그인 후 바꾸도록 안내해주세요.`)
