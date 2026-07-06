# 그린마일 팜 — 새 세션 인수인계 (2026-07-01 갱신)

> 컨텍스트가 길어져 **새 대화창으로 이어가기 위한 문서**입니다.
> 새 세션 시작 시 이 파일을 먼저 읽어달라고 요청하세요. (예: "HANDOFF.md 읽고 이어서 작업해줘")

---

## 1. 한 줄 요약
광주 시민참여형 **친환경 이동 인증 → CO₂ 감축 → 가상 방울토마토 성장 → 실물 작물 보상** 웹사이트.
스택: Next.js 14(App Router)+TS+Tailwind / Supabase(Auth·DB·Storage·RLS) / Vercel / 카카오 지도.
운영: 참여 15명 규모, 목표 감축 **5kg**, 교통 4수단(걷기·자전거·버스·지하철). 챌린지 마감(잠정) **2026-08-02(일)**.

## 2. 사용자(주연서) 작업 선호 — 반드시 지킬 것
- **한국어**, **표/번호 단계**로 설명. 프로그래밍·디자인 초보 → 전문용어는 풀어서.
- **확정 vs 불확실**을 명확히 구분.
- **배포는 사용자가 "배포해/배포해도 돼"라고 할 때만.** 그 전엔 로컬 빌드까지만 하고 대기.
- **토큰 절약**: 같은 파일 반복 Read 금지, 전체 Write보다 Edit 우선, dev 서버 매 턴 재시작 금지.
- 코드 변경 시 **기능 로직은 보존, 겉모습만** 바꾸는 게 기본 원칙.

## 3. 현재 상태 (★중요)
- **운영 배포 완료.** `main` = `b95b98d` (origin/main과 동기화). 로컬=원격=운영 일치.
- GitHub: https://github.com/wndustj1004/green-mile-farm (main)
- 라이브: https://green-mile-farm.vercel.app
- **Supabase 마이그레이션 02~10 전부 DB 적용 완료**(REST로 확인함). 아래 4번 참고.

## 4. 배포 절차 & 인프라
1. 코드 수정 → `npx tsc --noEmit` + `npm run build` 통과 확인 (OneDrive `.next` EBUSY 나면 dev 끄고 `.next` 삭제 후 재시도).
2. 사용자가 "배포해" 하면: `git add -A && git commit && git push origin main` → **Vercel 자동 배포**.
   - 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
   - 자동배포 안 뜨면 **빈 커밋 push로 재트리거** (과거 웹훅 누락 사례 있었음).
- **Vercel 환경변수**(Production·Preview·Development 등록됨): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_KAKAO_MAP_KEY`, `KAKAO_REST_API_KEY`. 비밀값은 `.env.local`(gitignore)에 있음.
- **카카오 콘솔** Web 도메인: `localhost:3000`, `green-mile-farm.vercel.app` 등록됨. (Vercel **프리뷰 브랜치 URL**은 도메인 미등록 → 프리뷰에선 지도 안 뜸, 운영은 정상)
- **SQL은 코드 배포와 별개**: 새 마이그레이션 파일 만들면 사용자가 Supabase SQL Editor에서 **직접 실행**해야 함. `supabase/NN_*.sql`. (02~10 이미 실행됨)

## 5. 아키텍처 · 주요 기능 (파일 위치)
### 메인페이지 `app/page.tsx` (섹션 순서)
헤더 → Hero(청록·토마토화분 SVG) → 미션(초록) → **참여 4단계**(StepRow) → **이동 인증 튜토리얼**(`components/CertifyTutorial.tsx`, 좌우 슬라이더, 예시이미지 3장) → **실시간 임팩트**(참여자·감축·수확·목표, `challenge_stats` RPC 연동) → **작물 보상+작물관리팀 케어로그**(`components/RewardSection.tsx`, 보라카드+폰목업 채팅) → **소개 섹션들**(`components/LandingSections.tsx`) → **하단 CTA**(챌린지 시작하기, 회원가입 진입 유일) → 푸터.
- `LandingSections` 매핑(landing_sections DB row 순서 index): **0=G.P.S 소개**(`GpsIntro`, 딥크림) / **1=공모사업**(`components/ProjectSection.tsx`, 딥그린 패널) / **2=대중교통 정책·현황**(`components/TransportSection.tsx`) + 바로 뒤 **광주 교통 온실가스 DATA**(`components/EmissionDataSection.tsx`, 애니메이션 자체 포함) / **3=null**(옛 온실가스 row, 미표시) / **4=작물 사진 캐러셀**(`CropCarousel`) / 그 외=Story 폴백. ※ 2·3은 index 고정 매핑이라 **admin에서 섹션 순서 바꾸면 깨질 수 있음**(주의).

### 관리자 편집(랜딩 내용) `app/admin/content/`
- **① 스크롤 소개 섹션**: `ContentManager.tsx` — landing_sections(공모·정책·온실가스·작물사진)의 제목·본문·이미지·순서·추가/삭제.
- **② 메인페이지 텍스트**: `SiteTextEditor.tsx` — Hero·참여4단계·가이드·임팩트·G.P.S·재배현장·푸터 등 **고정 문구**를 key-value로 편집.
- **③ 메인페이지 이미지**: `SiteImageEditor.tsx` — 가이드 예시 3장(STEP2 지도/STEP3 실제공간/STEP3 지도) + 재배 현장 사진 2장 업로드.
- 필드 정의는 **`lib/siteText.ts`** (`SITE_TEXT_FIELDS`, `SITE_IMAGE_FIELDS`, `resolveSiteTexts`). DB에 값 없으면 코드 기본값(def) fallback → SQL 전에도 화면 안 깨짐. 저장은 `site_texts` 테이블(09), 이미지는 `landing-images` 공개 버킷(04).

### 대시보드 `app/dashboard/page.tsx`
인사+**이름 변경**(`NameEditor.tsx`, 10일 쿨다운) + D-day + 작물(이모지)·성장바 + 통계3 + **StageSlider**(원본) + 최근인증 + [이동인증하기]/[인증 내용 보기] + **주간 랭킹**(`WeeklyRanking.tsx`, 포디움) + **앱처럼 사용하기**(`AppGuide.tsx`, 폰목업 이미지 `public/appguide/step1~4.png`).

### 인증 `app/certify/` (기능 로직 보존 최우선)
`CertifyForm`(다중동선)+`LegBlock`(교통수단·거리·사진4장)+`MapPicker`(카카오지도, **핀 30m 격자 스냅** = 신뢰성 핵심, 건드리지 말 것). 거리계산=`lib/kakao.ts` **`calcDistanceByCoords` = 하버사인 × `WALK_ROUTE_FACTOR`(1.3)** — 방향 무관(A→B=B→A). 카카오 자동차 길찾기 제거됨.

### 관리자 인증 심사 `app/admin/certifications/`
`CertActions.tsx` — 승인(모달에서 **이동거리 수정** 가능, CO₂ 재계산·이력 기록) / 반려(사유 모달). 액션=`app/admin/actions.ts`의 `reviewCert`.

### 서버 함수/RPC (전부 DB 적용됨)
- `challenge_stats()`(05) — 공개 집계(참여자·총감축kg·수확자). 관리자 통계와 동일 공식.
- `weekly_ranking()`(06) — 주간 상위6(월~현재 KST, 수확자 제외, 상위3 표시 ×1.5, 이름 마스킹+이메일아이디).
- `effective_reduction_g(uid)`(07) — 완료된 주 상위3 +50% 보너스 포함 실효 감축량(대시보드 작물 성장에 반영).
- 이름변경 컬럼(08 `profiles.name_changed_at`), 거리수정 컬럼(10 `certifications.original_distance_km`·`distance_edit_reason`·`distance_edited_by`·`distance_edited_at`).

## 6. 디자인 규칙 · 워크플로
- 색: `tailwind.config.ts`의 **`gm-*` 팔레트**(green #2f5d3c, leaf, cream, sage, fill, line, ink, tomato). 리치 섹션은 파일별 커스텀 hex 사용.
- **애니메이션**: `components/Reveal.tsx`(스크롤 페이드업). 메인 섹션·대시보드 요소에 적용됨. Hero 등 첫 화면은 즉시 표시.
- **작업 방식**: 사용자가 **직접 만든 HTML 파일(주로 `~/Downloads/*.html`)이나 캡처 이미지**를 주면 → React/Tailwind로 포팅(내용·애니메이션 동일하게). 데이터 많은 리치 섹션은 **고정 컴포넌트**로(편집 불가), 단순 소개는 CMS.
- **못 하는 것**: Figma(`/make/`)·claude.ai/design 링크는 이 환경이 리소스 내용을 못 읽음 → 사용자가 캡처/HTML/CSS 텍스트를 붙여줘야 함. claude_design·figma MCP는 비대화형이라 인증 불가.
- 목업이 필요하면 `visualize` `show_widget` 사용 가능. 로컬 프리뷰(`Claude_Preview` MCP)는 렌더러가 잘 멈춤(비추천).
- **채팅에 붙인 이미지는 저장 불가** → 사이트에 쓸 이미지는 관리자 업로드 or 사용자가 `public/`·repo에 직접 넣어야 함.

## 7. 보존 원칙 (건드리면 안 되는 것)
- 작물 이모지(`lib/growth.ts` STAGE_EMOJI)·`StageSlider` 원본 유지.
- `MapPicker` 30m 격자 스냅, 거리계산 방향무관 로직.
- 인증 제출·다중동선·사진검증·EXIF 등 기능 로직.

## 8. 계정
- 관리자: username `wndustj1234` (is_admin).
- 프로젝트 경로: `C:\Users\wndus\OneDrive\Desktop\GreenMileFarm2` (OneDrive라 `.next` 잠금 주의).

## 9. 자주 난 이슈
- OneDrive `.next` EBUSY → dev 끄고 `.next` 삭제.
- Vercel 자동배포 누락 → 빈 커밋 재트리거.
- ESLint `no-img-element`/`no-explicit-any`는 필요 시 인라인 disable.
- 미사용 함수/변수 남으면 정리(빌드 경고 방지).

## 10. 메모리
새 세션은 `MEMORY.md`(user-profile / confirmed-decisions / tech-and-progress) 자동 로드. 이 HANDOFF는 "지금 당장 이어서 할 일"용 상세본.
