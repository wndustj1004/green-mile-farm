-- =============================================================
--  그린마일 팜 — 승인 시 이동거리 수정 기능
--  관리자가 승인하면서 자동계산 거리를 올바른 값으로 고치면 기록을 남깁니다.
--  실행 위치: Supabase 대시보드 > SQL Editor > New query > 붙여넣기 > Run
-- =============================================================

alter table public.certifications
  add column if not exists original_distance_km numeric,      -- 수정 전 원래(자동계산) 거리
  add column if not exists distance_edit_reason text,          -- 거리 수정 사유
  add column if not exists distance_edited_by   uuid,          -- 수정한 관리자
  add column if not exists distance_edited_at   timestamptz;   -- 수정 시각

-- =============================================================
--  끝. "Success. No rows returned"이 나오면 정상입니다.
-- =============================================================
