-- =============================================================
--  그린마일 팜 — 메인페이지 고정 텍스트 편집 저장소
--  관리자 '랜딩 내용'에서 수정한 문구를 key-value로 저장. (없으면 코드 기본값 사용)
--  실행 위치: Supabase 대시보드 > SQL Editor > New query > 붙여넣기 > Run
-- =============================================================

create table if not exists public.site_texts (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

alter table public.site_texts enable row level security;

drop policy if exists "site_texts_read" on public.site_texts;
create policy "site_texts_read" on public.site_texts
  for select using (true);

drop policy if exists "site_texts_write_admin" on public.site_texts;
create policy "site_texts_write_admin" on public.site_texts
  for all using (public.is_admin()) with check (public.is_admin());

-- =============================================================
--  끝. "Success. No rows returned"이 나오면 정상입니다.
-- =============================================================
