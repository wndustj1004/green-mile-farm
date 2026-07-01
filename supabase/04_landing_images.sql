-- =============================================================
--  그린마일 팜 — 랜딩 섹션 이미지 첨부 기능
--  실행 위치: Supabase 대시보드 > SQL Editor > New query > 붙여넣기 > Run
--  여러 번 다시 실행해도 안전합니다.
-- =============================================================

-- 1) landing_sections에 이미지 목록 컬럼 추가 (섹션당 여러 장)
alter table public.landing_sections
  add column if not exists images text[] not null default '{}';

-- 2) 공개 이미지 저장소 버킷 (랜딩은 공개 페이지라 public=true)
insert into storage.buckets (id, name, public)
values ('landing-images', 'landing-images', true)
on conflict (id) do nothing;

-- 3) 저장소 보안 규칙 — 누구나 열람(공개), 업로드·삭제는 관리자만
drop policy if exists "landing_img_read" on storage.objects;
create policy "landing_img_read" on storage.objects
  for select using (bucket_id = 'landing-images');

drop policy if exists "landing_img_insert_admin" on storage.objects;
create policy "landing_img_insert_admin" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'landing-images' and public.is_admin());

drop policy if exists "landing_img_delete_admin" on storage.objects;
create policy "landing_img_delete_admin" on storage.objects
  for delete to authenticated
  using (bucket_id = 'landing-images' and public.is_admin());

-- =============================================================
--  끝. "Success. No rows returned"이 나오면 정상입니다.
-- =============================================================
