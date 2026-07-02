import { createClient } from '@/lib/supabase/server'
import type { LandingSection } from '../actions'
import { resolveSiteTexts } from '@/lib/siteText'
import ContentManager from './ContentManager'
import SiteTextEditor from './SiteTextEditor'
import SiteImageEditor from './SiteImageEditor'

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
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-800">랜딩 내용</h1>
        <p className="mt-1 text-sm text-gray-500">
          메인페이지의 글과 이미지를 여기서 수정합니다. 저장하면 사이트에 즉시 반영됩니다(재배포 불필요).
        </p>
      </div>

      {/* ① 스크롤 소개 섹션 */}
      <section>
        <h2 className="text-lg font-bold text-gray-800">① 스크롤 소개 섹션</h2>
        <p className="mt-1 text-sm text-gray-500">
          메인페이지 아래로 스크롤하면 나오는 소개 섹션(공모사업 · 대중교통 정책 · 교통부문 온실가스 · 작물 사진)을
          관리합니다. 섹션마다 제목·본문·이미지를 넣고 순서를 바꿀 수 있어요.
          <br />
          <span className="text-amber-600">※ 맨 위 &lsquo;G.P.S 소개&rsquo; 섹션의 문구는 아래 ② 메인페이지 텍스트에서 수정하세요.</span>
        </p>
        <div className="mt-4">
          <ContentManager initial={sections} />
        </div>
      </section>

      {/* ② 메인페이지 텍스트 */}
      <section className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-bold text-gray-800">② 메인페이지 텍스트</h2>
        <p className="mt-1 text-sm text-gray-500">
          고정 섹션(Hero · 참여 4단계 · 이동 인증 가이드 · 실시간 임팩트 · 작물 보상 · G.P.S 소개 · CTA · 푸터)의 문구를
          수정합니다.
        </p>
        <div className="mt-4">
          <SiteTextEditor initial={siteTexts} />
        </div>
      </section>

      {/* ③ 메인페이지 이미지 */}
      <section className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-bold text-gray-800">③ 메인페이지 이미지</h2>
        <p className="mt-1 text-sm text-gray-500">
          이동 인증 가이드 카드에 들어갈 예시 사진(지도 스크린샷 · 실제 공간 사진)을 올립니다. 올리면 가이드 슬라이드에
          바로 표시됩니다.
        </p>
        <div className="mt-4">
          <SiteImageEditor initial={siteTexts} />
        </div>
      </section>
    </div>
  )
}
