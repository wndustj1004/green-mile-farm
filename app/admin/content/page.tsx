import { createClient } from '@/lib/supabase/server'
import type { LandingSection } from '../actions'
import ContentManager from './ContentManager'

export const dynamic = 'force-dynamic'

export default async function AdminContentPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('landing_sections')
    .select('id, sort_order, emoji, title, body, visible, images')
    .order('sort_order', { ascending: true })

  const sections = ((data ?? []).map((s) => ({ ...s, images: s.images ?? [] }))) as LandingSection[]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-800">랜딩 내용</h1>
        <p className="mt-1 text-sm text-gray-500">
          메인페이지를 아래로 스크롤하면 보이는 소개 섹션입니다. 여기서 글을 고치면 사이트에
          즉시 반영됩니다(재배포 불필요).
        </p>
      </div>
      <ContentManager initial={sections} />
    </div>
  )
}
