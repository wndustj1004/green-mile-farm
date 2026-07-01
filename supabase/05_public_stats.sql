-- =============================================================
--  그린마일 팜 — 공개 집계(실시간 임팩트) 함수
--  메인페이지(비로그인 방문자)도 전체 참여자·감축량을 볼 수 있게
--  security definer 함수로 집계값만 공개합니다. (개별 인증은 여전히 비공개)
--  실행 위치: Supabase 대시보드 > SQL Editor > New query > 붙여넣기 > Run
-- =============================================================

create or replace function public.challenge_stats()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'participants', (
      select count(distinct user_id) from public.certifications where status = 'approved'
    ),
    'total_reduced_kg', coalesce((
      select sum(co2_reduced_g) from public.certifications where status = 'approved'
    ), 0) / 1000.0,
    'harvest_count', (
      select count(*) from (
        select user_id
        from public.certifications
        where status = 'approved'
        group by user_id
        having sum(co2_reduced_g) >=
          (select coalesce(target_co2_kg, 5) from public.settings where id = 1) * 1000
      ) h
    )
  );
$$;

grant execute on function public.challenge_stats() to anon, authenticated;

-- =============================================================
--  끝. "Success. No rows returned"이 나오면 정상입니다.
-- =============================================================
