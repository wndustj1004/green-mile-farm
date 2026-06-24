import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const NAV = [
  { href: '/admin', label: '통계' },
  { href: '/admin/certifications', label: '인증 내역' },
  { href: '/admin/participants', label: '참가자 명부' },
  { href: '/admin/settings', label: '설정' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  if (!profile?.is_admin) redirect('/dashboard') // 관리자 아니면 차단

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <span className="mr-2 font-bold text-green-700">🌿 관리자</span>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm text-gray-600 hover:text-green-700">
              {n.label}
            </Link>
          ))}
          <Link href="/dashboard" className="ml-auto text-sm text-gray-400 hover:text-gray-600">
            사이트로 →
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  )
}
