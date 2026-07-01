-- =============================================================
--  그린마일 팜 — 주간 랭킹 (대시보드 상위 6명)
--  이번 주(월~현재, 한국시간) 감축량 상위 6명. 수확 도달자 제외.
--  상위 3명은 표시 감축량에 50% 보너스 반영. 이름 마스킹 + 이메일 아이디.
--  다른 사용자 정보라 security definer로 집계값만 공개합니다.
--  실행 위치: Supabase 대시보드 > SQL Editor > New query > 붙여넣기 > Run
-- =============================================================

create or replace function public.weekly_ranking()
returns json
language sql
security definer
set search_path = public
as $$
  with target as (
    select coalesce(target_co2_kg, 5) as t from public.settings where id = 1
  ),
  week_start as (
    -- 이번 주 월요일 00:00 (한국시간)
    select (date_trunc('week', (now() at time zone 'Asia/Seoul')) at time zone 'Asia/Seoul') as ws
  ),
  totals as (
    select user_id, sum(co2_reduced_g) as total_g
    from public.certifications
    where status = 'approved'
    group by user_id
  ),
  weekly as (
    select user_id, sum(co2_reduced_g) as week_g
    from public.certifications
    where status = 'approved'
      and created_at >= (select ws from week_start)
    group by user_id
  ),
  eligible as (
    select w.user_id, w.week_g
    from weekly w
    join totals t on t.user_id = w.user_id
    where t.total_g < (select t from target) * 1000   -- 수확 도달자 제외
      and w.week_g > 0
  ),
  ranked as (
    select user_id, week_g, row_number() over (order by week_g desc) as rn
    from eligible
    order by week_g desc
    limit 6
  )
  select coalesce(json_agg(json_build_object(
    'rank', r.rn,
    'name', left(p.name, 1) || repeat('*', greatest(char_length(p.name) - 1, 0)),
    'email_id', split_part(p.email, '@', 1),
    'weekly_kg', round((case when r.rn <= 3 then r.week_g * 1.5 else r.week_g end) / 1000.0, 2),
    'bonus', (r.rn <= 3)
  ) order by r.rn), '[]'::json)
  from ranked r
  join public.profiles p on p.id = r.user_id;
$$;

grant execute on function public.weekly_ranking() to anon, authenticated;

-- =============================================================
--  끝. "Success. No rows returned"이 나오면 정상입니다.
-- =============================================================
