import { createClient } from '@/lib/supabase/server'
import type { LandingSection } from '../actions'
import { resolveSiteTexts } from '@/lib/siteText'
import ContentManager from './ContentManager'
import SiteTextEditor from './SiteTextEditor'

export const dynamic = 'force-dynamic'

export default async function AdminContentPage() {
  const supabase = createClient()
  const { data } = await supabase
    .from('landing_sections')
    .select('id, sort_order, emoji, title, body, visible, images')
    .order('sort_order', { ascending: true })

  const sections = ((data ?? []).map((s) => ({ ...s, images: s.images ?? [] }))) as LandingSection[]

  const { data: textRows } = await supabase.from('site_texts').select('key, value')
  const siteTexts = resolveSiteTexts(textRows)

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

      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-bold text-gray-800">메인페이지 텍스트</h2>
        <p className="mt-1 text-sm text-gray-500">
          메인페이지 고정 섹션(Hero·참여 4단계·가이드·임팩트·보상·G.P.S 소개·CTA)의 문구를 수정합니다. 저장하면 즉시 반영됩니다.
        </p>
        <div className="mt-4">
          <SiteTextEditor initial={siteTexts} />
        </div>
      </div>
    </div>
  )
}
