-- =============================================================
--  그린마일 팜 — 주간 랭킹 보너스를 작물 성장에 반영 (권장: 주간 정산)
--  상위 3명은 "완료된 주"에 한해 그 주 감축량의 50%를 추가 적립.
--  (이번 주는 순위 변동이 있으므로 성장에는 미반영 → 안정적)
--  수확 도달자(누적 목표 이상)는 보너스/랭킹 제외.
--  실행 위치: Supabase 대시보드 > SQL Editor > New query > 붙여넣기 > Run
-- =============================================================

create or replace function public.effective_reduction_g(uid uuid)
returns numeric
language sql
security definer
set search_path = public
as $$
  with target as (
    select coalesce(target_co2_kg, 5) * 1000 as tg from public.settings where id = 1
  ),
  totals as (
    select user_id, sum(co2_reduced_g) as tot
    from public.certifications where status = 'approved'
    group by user_id
  ),
  -- 사용자·주별 감축량 (한국시간 주 기준)
  weekly as (
    select
      user_id,
      date_trunc('week', (created_at at time zone 'Asia/Seoul')) as wk,
      sum(co2_reduced_g) as g
    from public.certifications
    where status = 'approved'
    group by user_id, date_trunc('week', (created_at at time zone 'Asia/Seoul'))
  ),
  -- 수확 도달자 제외 후 주별 순위
  ranked as (
    select w.user_id, w.wk, w.g,
      row_number() over (partition by w.wk order by w.g desc) as rn
    from weekly w
    join totals t on t.user_id = w.user_id
    where t.tot < (select tg from target)
  ),
  current_week as (
    select date_trunc('week', (now() at time zone 'Asia/Seoul')) as cw
  ),
  raw as (
    select coalesce(sum(co2_reduced_g), 0) as g
    from public.certifications where status = 'approved' and user_id = uid
  ),
  bonus as (
    select coalesce(sum(g * 0.5), 0) as b
    from ranked
    where user_id = uid
      and rn <= 3
      and wk < (select cw from current_week)   -- 완료된 주만
  )
  select (select g from raw) + (select b from bonus);
$$;

grant execute on function public.effective_reduction_g(uuid) to anon, authenticated;

-- =============================================================
--  끝. "Success. No rows returned"이 나오면 정상입니다.
-- =============================================================
