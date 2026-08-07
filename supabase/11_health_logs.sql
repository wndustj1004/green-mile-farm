-- =============================================================
--  그린마일 팜 — 상태 점검(Health Check) 기록 테이블 + 읽기 전용 조회 함수
--
--  실행 위치: Supabase 대시보드 > SQL Editor > New query > 붙여넣기 > Run
--  여러 번 다시 실행해도 안전합니다. (기존 데이터는 지워지지 않습니다)
--
--  ★ 이 파일은 기존 테이블(profiles, certifications, settings 등)의
--    데이터를 절대 수정하거나 삭제하지 않습니다. 새 표 1개를 추가하고,
--    "읽기만 하는" 조회 함수 3개를 만듭니다.
-- =============================================================


-- -------------------------------------------------------------
-- 1) 표: health_logs — 점검을 실행할 때마다 결과 1줄이 쌓입니다.
-- -------------------------------------------------------------
create table if not exists public.health_logs (
  id           uuid primary key default gen_random_uuid(),
  run_at       timestamptz not null default now(),          -- 점검 실행 시각
  trigger_by   text not null default 'manual'               -- 누가 실행했나
                 check (trigger_by in ('cron', 'manual')),   --   cron=자동 / manual=관리자 버튼
  overall      text not null                                 -- 종합 판정
                 check (overall in ('ok', 'warn', 'danger')), --   ok=🟢 warn=🟡 danger=🔴
  duration_ms  integer not null default 0,                   -- 점검에 걸린 시간(밀리초)
  ok_count     integer not null default 0,                   -- 🟢 항목 수
  warn_count   integer not null default 0,                   -- 🟡 항목 수
  danger_count integer not null default 0,                   -- 🔴 항목 수
  commit_sha   text,                                         -- 그때 운영 중이던 코드 버전
  result       jsonb  not null default '[]'::jsonb           -- 항목별 상세 결과
);

-- 최근 순으로 빠르게 뽑기 위한 색인
create index if not exists health_logs_run_at_idx
  on public.health_logs (run_at desc);


-- -------------------------------------------------------------
-- 2) 보안 규칙(RLS)
--    - 조회: 관리자만
--    - 기록(insert): 정책을 만들지 않음 → 일반 사용자는 절대 못 씀.
--      서버(서비스 롤 키)만 기록할 수 있습니다.
-- -------------------------------------------------------------
alter table public.health_logs enable row level security;

drop policy if exists "health_logs_select_admin" on public.health_logs;
create policy "health_logs_select_admin" on public.health_logs
  for select using (public.is_admin());


-- -------------------------------------------------------------
-- 3) 조회 함수 ① — 데이터베이스 용량 / 표별 크기
--    "SELECT만" 하는 읽기 전용 함수입니다.
-- -------------------------------------------------------------
create or replace function public.health_db_stats()
returns json
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select json_build_object(
    'db_bytes', pg_database_size(current_database()),
    'tables', coalesce((
      select json_agg(t)
      from (
        select c.relname                        as name,
               pg_total_relation_size(c.oid)    as total_bytes,
               coalesce(s.n_live_tup, 0)        as row_estimate
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        left join pg_stat_user_tables s on s.relid = c.oid
        where n.nspname = 'public'
          and c.relkind = 'r'
        order by pg_total_relation_size(c.oid) desc
        limit 10
      ) t
    ), '[]'::json)
  );
$$;


-- -------------------------------------------------------------
-- 4) 조회 함수 ② — 저장소(Storage) 버킷별 파일 개수 / 용량
-- -------------------------------------------------------------
create or replace function public.health_storage_stats()
returns json
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  select coalesce((
    select json_agg(x)
    from (
      select o.bucket_id                                        as bucket,
             count(*)                                           as files,
             coalesce(sum((o.metadata->>'size')::bigint), 0)    as bytes
      from storage.objects o
      where o.name not like '%.emptyFolderPlaceholder'
      group by o.bucket_id
      order by o.bucket_id
    ) x
  ), '[]'::json);
$$;


-- -------------------------------------------------------------
-- 5) 조회 함수 ③ — 인증 사진 대조 (DB 기록 ↔ 실제 저장된 파일)
--    · missing : DB에는 경로가 있는데 실제 파일이 없음  → 사진이 안 보임
--    · orphan  : 파일은 있는데 DB 어디에서도 안 씀       → 용량 낭비
-- -------------------------------------------------------------
create or replace function public.health_photo_audit()
returns json
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  with db_paths as (
    select unnest(array[start_photo_1, start_photo_2, end_photo_1, end_photo_2]) as path
    from public.certifications
  ),
  db_clean as (
    select distinct path from db_paths where path is not null and path <> ''
  ),
  files as (
    select o.name, (o.metadata->>'size')::bigint as bytes
    from storage.objects o
    where o.bucket_id = 'certification-photos'
      and o.name not like '%.emptyFolderPlaceholder'
  ),
  missing as (
    select d.path
    from db_clean d
    left join files f on f.name = d.path
    where f.name is null
  ),
  orphan as (
    select f.name, f.bytes
    from files f
    left join db_clean d on d.path = f.name
    where d.path is null
  )
  select json_build_object(
    'db_paths',        (select count(*) from db_clean),
    'storage_files',   (select count(*) from files),
    'missing_count',   (select count(*) from missing),
    'missing_samples', coalesce((select json_agg(path) from (select path from missing limit 20) m), '[]'::json),
    'orphan_count',    (select count(*) from orphan),
    'orphan_bytes',    (select coalesce(sum(bytes), 0) from orphan),
    'orphan_samples',  coalesce((select json_agg(name) from (select name from orphan limit 20) o), '[]'::json)
  );
$$;


-- -------------------------------------------------------------
-- 6) 함수 실행 권한 — 서버(서비스 롤)만 실행 가능하게 잠급니다.
--    일반 방문자(anon)·로그인 사용자(authenticated)는 실행할 수 없습니다.
-- -------------------------------------------------------------
revoke execute on function public.health_db_stats()       from public, anon, authenticated;
revoke execute on function public.health_storage_stats()  from public, anon, authenticated;
revoke execute on function public.health_photo_audit()    from public, anon, authenticated;

grant execute on function public.health_db_stats()      to service_role;
grant execute on function public.health_storage_stats() to service_role;
grant execute on function public.health_photo_audit()   to service_role;


-- =============================================================
--  끝. "Success. No rows returned"이 나오면 정상입니다.
-- =============================================================
