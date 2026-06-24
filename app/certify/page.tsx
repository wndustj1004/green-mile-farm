import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CertifyForm from './CertifyForm'

export default async function CertifyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return <CertifyForm userId={user.id} />
}
