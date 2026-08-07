# 그린마일 팜 — 새 세션 인수인계 (2026-08-07 갱신)

> 새 대화창에서 작업을 이어가기 위한 문서입니다.
> 새 세션 첫 메시지: "HANDOFF.md 읽고 이어서 작업해줘"
> 운영·문서화 관점의 인수인계는 `COWORK_HANDOFF.md`(Cowork용)에 따로 있습니다.

---

## 1. 한 줄 요약
광주 시민참여형 **친환경 이동 인증 → CO₂ 감축 → 가상 방울토마토 성장 → 실물 작물 보상** 웹사이트.
스택: Next.js 14(App Router)+TS+Tailwind / Supabase(Auth·DB·Storage·RLS) / Vercel / 카카오 지도.
교통 4수단: 걷기·자전거·버스·지하철. 목표 감축 **5kg**.

## 2. 사용자(주연서) 작업 선호 — 반드시 지킬 것
- **한국어**, **표·번호 단계**로 설명. 프로그래밍·디자인 초보 → 전문용어는 풀어서.
- **확정 vs 불확실**을 명확히 구분. 모르면 모른다고 말하기.
- **배포는 사용자가 "배포해"라고 할 때만.** 그 전엔 로컬 빌드까지만 하고 대기.
- **토큰 절약**: 같은 파일 반복 Read 금지, 전체 Write보다 Edit 우선, dev 서버 매 턴 재시작 금지.
- 코드 변경 시 **기능 로직은 보존, 겉모습만** 바꾸는 게 기본 원칙.

## 3. 현재 상태
| 항목 | 값 |
|---|---|
| 운영 배포 | 완료 (운영 중) |
| `main` 최신 커밋 | `9bba299` REWARD 섹션 리뉴얼 — 토마토 바질 청 |
| GitHub | https://github.com/wndustj1004/green-mile-farm |
| 라이브 | https://green-mile-farm.vercel.app |
| Supabase 마이그레이션 | `02`~`10` **전부 DB 적용 완료** (새 SQL 파일 없음) |

**⚠️ 확인 필요(불확실)** — 아래는 DB `settings`·관리자 통계가 정답이므로 새 세션에서 먼저 확인할 것:
- **챌린지 기간**: 문서상 마지막 값은 `2026-07-06 ~ 2026-08-02`(잠정)이라 **이미 종료 시점이 지났을 수 있음**.
  (`supabase/schema.sql`의 `challenge_end` 기본값 `2026-07-26`은 초기 스키마 기본값일 뿐, 실제 값은 관리자 설정에 있음)
- **참여 인원·누적 감축량**: 문서마다 값이 달라 신뢰 불가 → `/admin` 통계 화면 기준으로 볼 것.

## 4. 배포 절차 & 인프라
1. 코드 수정 → `npx tsc --noEmit` + `npm run build` 통과 확인.
2. 사용자가 "배포해" 하면: `git add -A && git commit && git push origin main` → **Vercel 자동 배포**.
   - 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
   - 자동배포 안 뜨면 **빈 커밋 push로 재트리거**(과거 웹훅 누락 사례 있음).
3. **SQL은 코드 배포와 별개**: 새 마이그레이션(`supabase/NN_*.sql`)을 만들면 사용자가 Supabase SQL Editor에서 **직접 실행**해야 반영됨.

- **Vercel 환경변수**(Production·Preview·Development 등록됨):
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
  `NEXT_PUBLIC_KAKAO_MAP_KEY`, `KAKAO_REST_API_KEY`. 비밀값은 `.env.local`(gitignore)에 있음.
- **카카오 콘솔** Web 도메인: `localhost:3000`, `green-mile-farm.vercel.app` 등록됨.
  → Vercel **프리뷰 브랜치 URL은 미등록**이라 프리뷰에선 지도가 안 뜸(운영은 정상).

## 5. 아키텍처 · 주요 기능

### 5-1. 메인페이지 `app/page.tsx` (섹션 순서)
헤더 → Hero → 미션 → **참여 4단계** → **이동 인증 튜토리얼**(`components/CertifyTutorial.tsx`, 좌우 슬라이더+예시 3장)
→ **실시간 임팩트**(`challenge_stats` RPC) → **작물 보상**(`components/RewardSection.tsx`)
→ **소개 섹션들**(`components/LandingSections.tsx`) → **하단 CTA**(회원가입 진입 유일) → 푸터.

- `RewardSection` = 상단 **`RewardShowcase`**(토마토 바질 청, 가로 레일 4패널 · 고정 디자인)
  + 하단 **REAL FARM**(재배 현장 텍스트·사진 2장, 관리자 편집).
- `LandingSections` 매핑(**landing_sections DB row 순서 index 고정**):

| index | 내용 | 파일 |
|---|---|---|
| 0 | G.P.S 소개 | `GpsIntro`(딥크림) |
| 1 | 공모사업 | `components/ProjectSection.tsx` |
| 2 | 대중교통 정책·현황 + 바로 뒤 **광주 교통 온실가스 DATA** | `TransportSection.tsx` + `EmissionDataSection.tsx` |
| 3 | **null**(옛 온실가스 row, 미표시 — 2번에 통합됨) | — |
| 4 | 작물 사진 캐러셀 | `CropCarousel` |
| 그 외 | Story 폴백 | — |

> ⚠️ index 고정 매핑이라 **admin에서 섹션 순서를 바꾸면 화면이 깨질 수 있음**.

### 5-2. 관리자 랜딩 편집 `app/admin/content/`
| 파일 | 편집 대상 |
|---|---|
| `ContentManager.tsx` | landing_sections(공모·정책·작물사진)의 제목·본문·이미지·순서·추가/삭제 |
| `SiteTextEditor.tsx` | 메인페이지 **고정 문구**(Hero·참여4단계·가이드·임팩트·G.P.S·재배현장·푸터) key-value |
| `SiteImageEditor.tsx` | 가이드 예시 3장 + 재배 현장 사진 2장 업로드 |

- 필드 정의는 **`lib/siteText.ts`**(`SITE_TEXT_FIELDS`, `SITE_IMAGE_FIELDS`, `resolveSiteTexts`).
  DB에 값 없으면 코드 기본값으로 fallback → SQL 전에도 화면 안 깨짐.
- 저장: `site_texts` 테이블(09) / 이미지: `landing-images` 공개 버킷(04).

### 5-3. 대시보드 `app/dashboard/`
인사 + **이름 변경**(`NameEditor.tsx`, 10일 쿨다운) + D-day + 작물(이모지)·성장바 + 통계3
+ **StageSlider**(원본 유지) + 최근 인증 + [이동인증하기]/[인증 내용 보기]
+ **주간 랭킹**(`components/WeeklyRanking.tsx`, 포디움)
+ **앱처럼 사용하기** — **iOS/Android 분리**
  - iOS: `components/AppGuide.tsx` (`public/appguide/step1~4.png`)
  - Android: `components/AndroidAppGuide.tsx` (`public/appguide-android/step1~6.png`)

### 5-4. 인증 `app/certify/` (기능 로직 보존 최우선)
`CertifyForm.tsx`(다중 동선) + `LegBlock.tsx`(교통수단·거리·사진4장) + `MapPicker.tsx`(카카오 지도).
- **핀 30m 격자 스냅** = 신뢰성 핵심, 건드리지 말 것.
- 거리 계산 = `lib/kakao.ts`의 **`calcDistanceByCoords`**
  = **하버사인 직선거리 × `WALK_ROUTE_FACTOR`(1.3)**, **방향 무관**(A→B = B→A).
- 카카오 **자동차 길찾기 API는 제거됨**(A→B와 B→A 값이 달라 부적합).
- **감축량 = (승용차 배출계수 − 선택 수단 배출계수) × 거리** → `app/certify/actions.ts`, 서버에서 계산(조작 불가).

### 5-5. 관리자 인증 심사 `app/admin/certifications/`
`CertActions.tsx` — 승인(모달에서 **이동거리 수정** 가능 → CO₂ 재계산·이력 기록) / 반려(사유 필수).
액션은 `app/admin/actions.ts`의 `reviewCert`.
목록은 **페이지네이션(15건)+상태 필터+200px 썸네일**, 원본은 클릭 시에만 열람(egress 절감).

### 5-6. 서버 함수 / RPC (전부 DB 적용됨)
| 함수 | 파일 | 역할 |
|---|---|---|
| `challenge_stats()` | 05 | 공개 집계(참여자·총감축kg·수확자) |
| `weekly_ranking()` | 06 | 주간 상위6(월~현재 KST, 수확자 제외, 상위3 표시 ×1.5, 이름 마스킹) |
| `effective_reduction_g(uid)` | 07 | 상위3 +50% 보너스 포함 실효 감축량(작물 성장에 반영) |
| — | 08 / 10 | 이름변경 컬럼 / 거리수정 이력 컬럼 |

### 5-7. 이미지 전송량(egress) 최적화 — `lib/img.ts`
- `supaImg(url, {width,height,quality,resize})` — Supabase Image Transformation으로 **표시 시점 축소**. 원본·CMS는 그대로.
- `compressImage(file)` — **업로드 전 클라이언트 리사이즈·압축**(방향 보존, EXIF 추출 후 실행, 실패 시 원본 반환).
- 업로드 캐시 헤더 1년(`max-age=31536000`).
- 배경: Supabase 무료 egress 초과(201%) → 최적화 + Pro 전환 병행.

## 6. 디자인 규칙 · 워크플로
- 색: `tailwind.config.ts`의 **`gm-*` 팔레트**(green #2f5d3c, leaf, cream, sage, fill, line, ink, tomato).
  리치 섹션은 파일별 커스텀 hex 사용.
- **애니메이션**: `components/Reveal.tsx`(스크롤 페이드업). Hero 등 첫 화면은 즉시 표시.
- **로딩 UI**: `components/PageLoading.tsx` → `app/loading.tsx`, `app/admin/loading.tsx`.
- **작업 방식**: 사용자가 **직접 만든 HTML 파일이나 캡처 이미지**를 주면 → React/Tailwind로 포팅(내용·애니메이션 동일하게).
  데이터 많은 리치 섹션은 **고정 컴포넌트**(편집 불가), 단순 소개는 CMS.
- **제약**: 채팅에 붙인 이미지는 저장 불가 → 사이트에 쓸 이미지는 **관리자 업로드**하거나 사용자가 `public/`에 직접 넣어야 함.

## 7. 보존 원칙 (건드리면 안 되는 것)
- 작물 이모지(`lib/growth.ts` `STAGE_EMOJI`)·`StageSlider` 원본.
- `MapPicker` 30m 격자 스냅, 거리 계산 방향무관 로직.
- 인증 제출·다중동선·사진검증·EXIF 로직.

## 8. 계정 · 경로
- 관리자: username `wndustj1234` (is_admin).
- 로컬 경로: `C:\Users\wndus\OneDrive\Desktop\GreenMileFarm2` (OneDrive라 `.next` 잠금 주의).

## 9. 자주 난 이슈
| 증상 | 조치 |
|---|---|
| OneDrive `.next` EBUSY | dev 서버 끄고 `.next` 삭제 후 재시도 |
| Vercel 자동배포 누락 | 빈 커밋 push로 재트리거 |
| Supabase egress 초과 | `lib/img.ts` 경유 여부 확인(§5-7) |
| ESLint `no-img-element`/`no-explicit-any` | 필요 시 인라인 disable |
| 빌드 경고 | 미사용 함수·변수 정리 |

## 10. 저장소 내 기타 파일
| 경로 | 용도 |
|---|---|
| `COWORK_HANDOFF.md` | 운영·문서화 인수인계(Cowork용) |
| `docs/ppt-prompt.html` | 외부 담당자 미팅용 발표 PPT 생성 프롬프트 |
| `scripts/*.mjs` | 로컬 개발·점검용 스크립트(운영 미사용): 관리자 지정·샘플데이터·목표설정·카카오/좌표/다중동선 테스트 |
| `phone_image/` | **코드에서 참조하지 않는 작업용 캡처 4장** — 삭제 후보(사용자 확인 필요) |

## 11. 메모리
새 세션은 `MEMORY.md`(user-profile / confirmed-decisions / tech-and-progress) 자동 로드.
이 HANDOFF는 "지금 당장 이어서 할 일"용 상세본.
