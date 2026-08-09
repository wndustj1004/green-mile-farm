# 그린마일 팜 — 새 세션 인수인계 (2026-08-09 갱신)

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
- ★ **기능을 수정해 재배포할 때는 반드시 이 HANDOFF.md도 함께 갱신**한다 (2026-08-07 사용자 지시).
  갱신 대상: 3번 현재 상태(커밋 해시), 4번 배포·인프라(환경변수·마이그레이션), 5번 아키텍처(새 기능).
- **토큰 절약**: 같은 파일 반복 Read 금지, 전체 Write보다 Edit 우선, dev 서버 매 턴 재시작 금지.
- 코드 변경 시 **기능 로직은 보존, 겉모습만** 바꾸는 게 기본 원칙.

## 3. 현재 상태 (★중요)
- **운영 배포 완료.** `main` = `62177f3` (origin/main과 동기화). 로컬=원격=운영 일치.
- GitHub: https://github.com/wndustj1004/green-mile-farm (main)
- 라이브: https://green-mile-farm.vercel.app
- **Supabase 마이그레이션 02~13 전부 DB 적용 완료**(REST로 확인함). 아래 4번 참고.
  (12·13은 2026-08-09 적용 — `scripts/check-bonus.mjs` 13명 전원 ✅ 검산 통과.
   13은 12의 `bonus_awards_all()`을 통째로 다시 정의함 → 12를 재실행할 필요 없음.)
- **관리자 상태 점검 시스템 가동 중** — `/admin/health`, 매일 KST 오후 8시대 자동. 아래 5번 참고.
- **배출계수 현재값**(2026-08-07 기준): 승용차 211.1 / 걷기 0 / 자전거 0 / 버스 29.1 / **지하철 1.53**.
  ※ 7/24에 지하철이 28.7로 잘못 들어가 버스와 거의 같아졌던 것을 8/7에 1.53으로 복원함.
  과거 인증은 그 당시 계수 값을 유지(소급 재계산 안 함) — 점검 B6이 이를 "정상 이력"으로 표시.

## 4. 배포 절차 & 인프라
1. 코드 수정 → `npx tsc --noEmit` + `npm run build` 통과 확인 (OneDrive `.next` EBUSY 나면 dev 끄고 `.next` 삭제 후 재시도).
2. 사용자가 "배포해" 하면: `git add -A && git commit && git push origin main` → **Vercel 자동 배포**.
   - 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
   - 자동배포 안 뜨면 **빈 커밋 push로 재트리거** (과거 웹훅 누락 사례 있었음).
- **Vercel 환경변수**(Production·Preview·Development 등록됨): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_KAKAO_MAP_KEY`, `KAKAO_REST_API_KEY`, **`CRON_SECRET`**(상태 점검 API 보호, 2026-08-07 추가). 비밀값은 `.env.local`(gitignore)에 있음.
- **Vercel Cron**(`vercel.json`): `/api/health`를 `0 11 * * *`(UTC) = **KST 오후 8시대** 하루 1회 실행.
  Hobby 플랜 상한 = **하루 1회·시각 ±59분·실패 시 재시도 없음**(공식 문서 확인). Cron은 **운영(Production) 배포에서만** 동작.
- **카카오 콘솔** Web 도메인: `localhost:3000`, `green-mile-farm.vercel.app` 등록됨. (Vercel **프리뷰 브랜치 URL**은 도메인 미등록 → 프리뷰에선 지도 안 뜸, 운영은 정상)
- **SQL은 코드 배포와 별개**: 새 마이그레이션 파일 만들면 사용자가 Supabase SQL Editor에서 **직접 실행**해야 함. `supabase/NN_*.sql`. (02~13 이미 실행됨)

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

### 보너스 적립 내역 (2026-08-09 추가)
주간 랭킹 상위 3명 +50% 보너스가 **대시보드 숫자에만 녹아 있어** 확인이 불가능하던 문제를 해결.
- **저장하지 않고 계산함**: 보너스 전용 표를 만들지 않고 `certifications`에서 매번 계산 → 인증 반려·거리 수정 시 자동 재계산, 중복/누락 불가. SQL = **`supabase/12_bonus_awards.sql`**.
- 함수 4개: `bonus_awards_all()`(내부 전용, 권한 회수) / `my_bonus_awards()`(본인) / `admin_bonus_awards()`(관리자만, 아니면 `[]`) / `effective_reduction_g(uid)`(**07을 대체**, 확정 보너스만 합산 — 결과값은 07과 동일).
- **확정(settled) vs 예정**: 주가 끝나야(월요일 0시 KST) 순위가 확정 → 진행 중인 주는 `settled=false`로 "적립 예정" 표시만 하고 누적 감축·작물 성장엔 **미반영**.
- 화면 ① 사용자 `/my` — 필터칩에 **🎁 보너스** 추가(`app/my/MyCertsList.tsx`의 `BonusPanel`). 상단 "누적 감축"도 대시보드와 동일하게 **보너스 포함** 값으로 통일(그 전엔 인증분만 표시해 두 화면 숫자가 달랐음).
- 화면 ② 관리자 `/admin/certifications?status=bonus` — `AdminBonusList.tsx`. 요약3 + 참가자별 합계표 + 상세표(적립 날짜·대상 기간·참가자·이벤트·산정 근거·적립량·상태).
- 화면 ③ 대시보드 — 누적 통계 아래 "🎁 보너스 +N kg 포함 · 내역 보기" 링크(`/my`).
- 타입·표시 규칙은 **`lib/bonus.ts`** 한 곳(`BONUS_KIND` 맵). 검산 스크립트 `node --env-file=.env.local scripts/check-bonus.mjs`.
- 날짜 표기는 `formatAwardedAt`이 **직접 조립**함(toLocaleString 금지) — 서버(Node)는 "AM", 브라우저는 "오전"으로 갈려서 관리자/사용자 화면 표기가 달라졌던 문제 때문.
- ★ **새 보너스 제도 추가 방법**: ① `bonus_awards_all()` 마지막 select에 `union all`로 새 블록 추가(`kind` 값만 새로 정함) ② `lib/bonus.ts`의 `BONUS_KIND`에 아이콘·라벨·설명 한 줄 추가. **화면 코드는 손댈 필요 없음.** (13번이 실제 사례)

#### 운영 중인 보너스 제도
| kind | 이름 | 조건 | 지급 | 확정 시점 | SQL |
|---|---|---|---|---|---|
| `weekly_rank` | 주간 랭킹 보너스 🏆 | 한 주(월~일) 감축량 상위 3명. **수확 도달자 제외** | 그 주 감축량의 50% | 그 주가 끝난 월요일 0시(KST). 진행 중인 주는 `settled=false` "적립 예정" | 12 |
| `steady3` | 우리 관계 steady♡ 💚 | **승인 인증 누적 3회** 달성 (1인 1회). 수확 도달자도 받음 | 1kg 정액 | 3번째 인증과 동시에 즉시 확정 | 13 |
- `steady3` 기준값(3회·1000g)은 **13번 SQL의 `cfg` CTE 한 곳**에 모여 있음 — 바꾸려면 거기만 수정.
- 두 제도 모두 **수확 도달자 판별(`totals`)에는 인증분만** 사용 → 보너스가 랭킹 자격에 되먹임되지 않음(순환 참조 방지). 이 원칙은 제도를 추가해도 유지할 것.
- 2026-08-09 `steady3` 도입 시 소급 적용 영향: **7명 +7kg**, 이로 인해 새로 수확(5kg) 달성한 사람은 **없음**(최근접 김□□·최○○ 3.68→4.68kg).

### 관리자 상태 점검 `/admin/health` (2026-08-07 추가)
서버·DB 안정성과 데이터 무결성을 자동 확인. **신호등 🟢정상/🟡주의/🔴위험 + 한국어 설명 + "무엇을 하면 되나요" 조치 안내**로 표시.
- **점검 31항목** — `lib/health/infra.ts`(A1~A9: 연결·RPC 3종·Storage 2·Auth·환경변수·배포버전) /
  `lib/health/integrity.ts`(B1~B14: 고아기록·사진4장·DB↔파일대조·이상값·과다거리·CO₂재계산·집계일관성·미검토방치·거리수정이력·설정유효성·고아파일·랜딩이미지·회원정보·일정) /
  `lib/health/capacity.ts`(C1~C8: DB/Storage 용량·표별크기·증가속도예측·응답추세·사진평균용량·기록누적·전송량 안내).
- **임계값은 `lib/health/types.ts`의 `TH` 상수 한 곳**에 모여 있음 — 기준 조정은 여기만 고치면 됨.
- 실행 경로 2가지: ① Vercel Cron → `app/api/health/route.ts`(`CRON_SECRET` Bearer 헤더 검증) ② 관리자 버튼 → `app/admin/health/actions.ts`(is_admin 확인). 그 외 요청은 401.
- 결과는 `health_logs` 표에 1행씩 기록(11번 SQL). 화면에서 최근 30회 이력 확인 가능.
- ★ **읽기 전용 원칙**: 점검 로직은 데이터를 절대 수정·삭제하지 않음. **유일한 쓰기 = `health_logs` INSERT**(`lib/health/run.ts`).
- **못 하는 것(확정)**: 월 전송량(Egress) 자동 측정 — Supabase 서버 통계라 앱에서 못 읽음(별도 관리 토큰 필요, 보안상 비권장). C8이 대시보드 링크로 안내만 함.
- 배출계수 변경 유틸: `node --env-file=.env.local scripts/set-emission.mjs subway 1.53` (관리자 > 설정 화면으로도 가능).

### 서버 함수/RPC (전부 DB 적용됨)
- `challenge_stats()`(05) — 공개 집계(참여자·총감축kg·수확자). 관리자 통계와 동일 공식.
- `weekly_ranking()`(06) — 주간 상위6(월~현재 KST, 수확자 제외, 상위3 표시 ×1.5, 이름 마스킹+이메일아이디).
- `effective_reduction_g(uid)`(07 → **12에서 재정의**) — 완료된 주 상위3 +50% 보너스 포함 실효 감축량(대시보드 작물 성장에 반영).
- **보너스 내역(12 → 13에서 `bonus_awards_all()` 재정의)** — `bonus_awards_all()`(내부) / `my_bonus_awards()` / `admin_bonus_awards()`. 위 "보너스 적립 내역" 참고.
- 이름변경 컬럼(08 `profiles.name_changed_at`), 거리수정 컬럼(10 `certifications.original_distance_km`·`distance_edit_reason`·`distance_edited_by`·`distance_edited_at`).
- **상태 점검(11)** — `health_logs` 표(RLS: 조회는 관리자만, 기록은 서비스 롤만) + 읽기 전용 함수 3개
  `health_db_stats()`(DB·표별 용량) / `health_storage_stats()`(버킷별 파일수·용량) / `health_photo_audit()`(DB 사진경로 ↔ 실제 파일 양방향 대조).
  세 함수는 `anon`·`authenticated` 실행 권한을 회수해 **서버(service_role)만 실행 가능**.

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
- 관리자: username `<관리자아이디>` (is_admin).
- 프로젝트 경로: `C:\Users\wndus\OneDrive\Desktop\GreenMileFarm2` (OneDrive라 `.next` 잠금 주의).

## 9. 자주 난 이슈
- OneDrive `.next` EBUSY → dev 끄고 `.next` 삭제.
- Vercel 자동배포 누락 → 빈 커밋 재트리거.
- ESLint `no-img-element`/`no-explicit-any`는 필요 시 인라인 disable.
- 미사용 함수/변수 남으면 정리(빌드 경고 방지).
- 커밋 메시지 여러 줄 입력 시 **PowerShell here-string(`@'…'@`)을 Bash 도구에 쓰면 깨짐** → Bash에서는 heredoc(`git commit -F - <<'MSG'`) 사용.

## 9-1. 상태 점검이 찾아낸 미해결 항목 (2026-08-07)
- 🟡 **주인 없는 사진 파일 16개(약 13.3MB)** — 업로드는 됐지만 어떤 인증에도 연결 안 된 파일. 사이트 동작엔 무해, 용량만 차지.
  **삭제는 되돌릴 수 없으므로 사용자 지시가 있을 때만** 진행할 것. 목록은 `/admin/health` B11 항목의 [자세히 보기]에서 확인.
- 🟡 **CO₂ 재계산 불일치 15건** — 배출계수를 바꾸기 전에 등록된 인증들. **정상 이력이며 조치 불필요**(과거 기록 소급 수정 안 하는 것이 원칙).

## 10. 메모리
새 세션은 `MEMORY.md`(user-profile / confirmed-decisions / tech-and-progress) 자동 로드. 이 HANDOFF는 "지금 당장 이어서 할 일"용 상세본.
