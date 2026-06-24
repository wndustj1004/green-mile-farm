// 백엔드 검증용 임시 스크립트 (브라우저 없이 회원가입/로그인 흐름 테스트)
// 실행: node --env-file=.env.local scripts/test-auth.mjs
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const secret = process.env.SUPABASE_SERVICE_ROLE_KEY

const anonClient = createClient(url, anon, { auth: { persistSession: false } })
const admin = createClient(url, secret, { auth: { persistSession: false } })

const stamp = Date.now()
const testEmail = `test_${stamp}@example.com`
const testUsername = `tester_${stamp}`
const testPassword = 'testpass123'

console.log('1) 회원가입(signUp) 시도...')
const { data: signUpData, error: signUpErr } = await anonClient.auth.signUp({
  email: testEmail,
  password: testPassword,
  options: {
    data: {
      username: testUsername,
      name: '검증테스트',
      phone: '010-1234-5678',
      address: '광주광역시 북구',
      age_confirmed: true,
      privacy_agreed: true,
    },
  },
})
if (signUpErr) {
  console.error('   ❌ 가입 실패:', signUpErr.message)
  process.exit(1)
}
const userId = signUpData.user?.id
console.log('   ✅ 가입 성공. user id:', userId, '| 즉시 세션:', !!signUpData.session)

console.log('2) 트리거가 profiles 행을 만들었는지 확인...')
const { data: profile, error: profErr } = await admin
  .from('profiles')
  .select('username, name, phone, address, email, age_confirmed, privacy_agreed, is_admin')
  .eq('id', userId)
  .single()
if (profErr || !profile) {
  console.error('   ❌ profiles 행 없음:', profErr?.message)
} else {
  console.log('   ✅ profiles 생성됨:', profile)
}

console.log('3) 아이디 → 이메일 변환(로그인 1단계) 확인...')
const { data: byUsername } = await admin
  .from('profiles')
  .select('email')
  .eq('username', testUsername)
  .maybeSingle()
console.log('   조회된 이메일:', byUsername?.email, byUsername?.email === testEmail ? '✅ 일치' : '❌ 불일치')

console.log('4) 이메일+비번 로그인(signInWithPassword) 확인...')
const { data: signIn, error: signInErr } = await anonClient.auth.signInWithPassword({
  email: byUsername.email,
  password: testPassword,
})
console.log('   ', signInErr ? '❌ 로그인 실패: ' + signInErr.message : '✅ 로그인 성공, 세션 발급됨: ' + !!signIn.session)

console.log('5) 테스트 계정 정리(삭제)...')
const { error: delErr } = await admin.auth.admin.deleteUser(userId)
console.log('   ', delErr ? '⚠️ 삭제 실패(수동 삭제 필요): ' + delErr.message : '✅ 테스트 계정 삭제 완료')

console.log('\n=== 검증 끝 ===')
