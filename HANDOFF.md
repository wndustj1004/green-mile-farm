# 그린마일 팜 — 새 세션 인수인계 (2026-06-30 작성)

> 이전 대화창이 길어져 오류(모델 과부하)가 잦아 **새 세션으로 이어가기 위한 인수인계 문서**입니다.
> 새 세션을 시작하면 **이 파일을 먼저 읽어달라고 요청**하세요. (예: "HANDOFF.md 읽고 이어서 작업해줘")

---

## 1. 한 줄 요약
광주 시민참여형 **친환경 이동 인증 → CO₂ 감축 → 가상 방울토마토 성장 → 실물 작물 보상** 웹사이트.
스택: Next.js 14(App Router) + TS + Tailwind / Supabase(Auth·DB·Storage·RLS) / Vercel / 카카오지도.
운영 일정: **2026-07-06 ~ 07-26 (3주)**, 참여 15명, 감축 목표 **5kg**, 교통수단 4종(걷기·자전거·버스·지하철).

## 2. 사용자(주연서) 작업 선호 — 반드시 지킬 것
- **한국어**로 답변. **표 / 번호 매긴 단계**로 설명. 프로그래밍 초보 → 전문용어는 풀어서.
- **확정된 것 vs 불확실한 것**을 명확히 구분해서 말할 것.
- **수정마다 매번 재배포하지 말 것.** 모든 수정을 모은 뒤 **마지막에 한 번만** 배포.
- **토큰 절약**: 같은 파일 반복 Read 금지, 전체 덮어쓰기(Write)보다 부분 수정(Edit) 우선, 매 턴 dev 서버 재시작 금지.

## 3. 현재 코드 상태 (★중요)
- **로컬 코드 = 최신**(아래 기능 전부 구현·`npx tsc --noEmit` 통과 기준).
- **그러나 전부 커밋 안 됨** → **Vercel 라이브는 옛 버전**(커밋 3개 시점).
- 마지막 커밋: `65c344e 지도 거리 계산을 건물 단위로 정확화`

### 커밋 안 된 변경 목록
| 상태 | 파일 | 내용 |
|---|---|---|
| M | app/certify/CertifyForm.tsx | 다중 동선(leg) 배열 + 순차 모달 |
| ?? | app/certify/LegBlock.tsx | 동선 1개 UI(교통수단·핀·사진4장) |
| M | app/certify/MapPicker.tsx | 핀 좌표 ~30m 격자 스냅 |
| M | app/admin/actions.ts | reviewCert(승인/반려+사유+processed_at) |
| ?? | app/admin/certifications/CertActions.tsx | 승인/반려 버튼 + 반려사유 모달 |
| M | app/admin/certifications/page.tsx | 처리시각·반려사유 표시 |
| ?? | app/my/page.tsx | 사용자 본인 인증 내용 보기 |
| ?? | app/dashboard/StageSlider.tsx | 작물 5단계 카드 슬라이더 |
| M | app/dashboard/page.tsx | StageSlider + '인증 내용 보기' 버튼 |
| M | lib/growth.ts | 5단계 기준(0/1.0/2.0/3.5/5.0kg) |
| M | supabase/schema.sql | certifications에 processed_at·reject_reason |
| ?? | supabase/02_admin_review.sql | 위 컬럼 추가 SQL — **Supabase에 이미 적용 완료** |
| ?? | scripts/test-multileg.mjs | 다중동선 검증 스크립트 |

## 4. 남은 할 일 (다음 세션에서)
1. **(미정)** StageSlider 디자인을 사용자가 눈으로 확인 → OK면 다음으로.
2. **최종 배포 절차 (한 번에)**:
   1. `npx tsc --noEmit` 통과 확인
   2. `npm run build` (프로덕션 빌드 통과 확인) — OneDrive `.next` 잠금(EBUSY) 나면: dev 서버 끄고 `.next` 폴더 삭제 후 재시도
   3. `git add -A && git commit && git push`
   4. **Vercel 환경변수에 `NEXT_PUBLIC_KAKAO_MAP_KEY` 추가** (현재 미등록 → 배포본 지도 안 뜸)
   5. **카카오 개발자콘솔 Web 도메인에 `https://green-mile-farm.vercel.app` 등록**
   6. Vercel 재배포 → 휴대폰에서 지도·인증 테스트

## 5. 자주 났던 오류 & 해결
- **OneDrive `.next` 잠금(EBUSY) → Internal Server Error**: dev 서버 종료 → `.next` 삭제 → 재시작.
- **카카오 캠퍼스 거리 동일 문제**: 카카오가 전남대 전 건물에 같은 주소를 줌 → 주소정규화 폐기, **클릭 좌표 ~30m 격자 스냅**으로 해결(다른 건물=다른 거리, 마커는 클릭 위치 유지). **이 로직은 신뢰성 핵심 — 함부로 바꾸지 말 것.**
- **ESLint** `no-explicit-any`(MapPicker는 파일 상단 disable), `no-img-element`(인라인 disable).

## 6. 핵심 경로/계정
- 프로젝트: `C:\Users\wndus\OneDrive\Desktop\GreenMileFarm2`
- GitHub: https://github.com/wndustj1004/green-mile-farm (main)
- 라이브: https://green-mile-farm.vercel.app
- 관리자 계정: username `<관리자아이디>` (is_admin)
- 비밀 키는 `.env.local`(gitignore)에 있음 — Supabase URL/anon/service_role, 카카오 JS키·REST키.

## 7. 메모리
새 세션은 `MEMORY.md`(user-profile / confirmed-decisions / tech-and-progress)를 자동 로드함.
이 HANDOFF.md는 그보다 더 구체적인 "지금 당장 이어서 할 일" 용도.
