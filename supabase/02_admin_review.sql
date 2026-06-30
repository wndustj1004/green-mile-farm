-- =============================================================
--  관리자 승인/반려 보완: certifications 테이블에 처리정보 컬럼 추가
--  실행: Supabase 대시보드 > SQL Editor > New query > 붙여넣기 > Run
--  (여러 번 실행해도 안전 — IF NOT EXISTS)
-- =============================================================

alter table public.certifications
  add column if not exists processed_at  timestamptz,  -- 승인/반려한 시각
  add column if not exists reject_reason text;          -- 반려 사유(반려 시에만)

-- 실행 후 "Success. No rows returned"이 나오면 정상입니다.
