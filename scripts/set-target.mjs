// 목표 감축량(kg) 변경: node --env-file=.env.local scripts/set-target.mjs 5
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const kg = Number(process.argv[2])
if (!kg || kg <= 0) {
  console.error('사용법: node --env-file=.env.local scripts/set-target.mjs <kg>')
  process.exit(1)
}

const { data, error } = await admin
  .from('settings')
  .update({ target_co2_kg: kg, updated_at: new Date().toISOString() })
  .eq('id', 1)
  .select('target_co2_kg')

console.log(error ? '❌ ' + error.message : `✅ 목표 감축량 변경: ${data[0].target_co2_kg}kg`)
