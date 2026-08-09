-- =============================================================
--  그린마일 팜 — 보너스 적립 내역 조회 (12)
--
--  [이 파일이 하는 일]
--  지금까지 "주간 랭킹 상위 3명 +50%" 보너스는 대시보드의 누적 감축량 숫자에만
--  녹아 있어서, 누가·언제·어떤 이유로·몇 kg을 더 받았는지 확인할 수 없었습니다.
--  이 파일은 그 보너스를 "한 건씩 나열할 수 있는 내역"으로 만들어 줍니다.
--
--  [중요] 보너스는 별도 표로 저장하지 않고 인증 기록에서 그때그때 계산합니다.
--  → 인증이 반려/승인되거나 거리가 수정되면 보너스도 자동으로 다시 맞춰집니다.
--  → 적립 누락·중복 적립이 구조적으로 생길 수 없습니다.
--
--  [나중에 보너스 제도를 추가할 때]
--  아래 bonus_awards_all() 안의 마지막 select 를 union all 로 이어 붙이고,
--  kind 값(예: 'streak', 'event')만 새로 정하면 화면은 고칠 필요가 없습니다.
--
--  실행 위치: Supabase 대시보드 > SQL Editor > New query > 붙여넣기 > Run
-- =============================================================

-- -------------------------------------------------------------
-- 1) 전체 사용자 보너스 내역 (내부 전용 — 다른 함수에서만 호출)
--    직접 호출 권한은 회수합니다(다른 사람 정보가 섞여 있으므로).
-- -------------------------------------------------------------
create or replace function public.bonus_awards_all()
returns table (
  uid          uuid,         -- 받은 사람
  kind         text,         -- 보너스 종류 코드 (지금은 'weekly_rank' 하나)
  title        text,         -- 화면에 보일 이름  예) 주간 랭킹 1위
  detail       text,         -- 산정 근거 한 줄 설명
  period_start date,         -- 대상 기간 시작 (그 주 월요일, 한국시간)
  period_end   date,         -- 대상 기간 끝   (그 주 일요일)
  awarded_at   timestamptz,  -- 적립 확정 시각 (그 주가 끝난 순간 = 다음 월요일 0시)
  base_g       numeric,      -- 산정 기준 감축량(g)
  rate         numeric,      -- 적립 비율 (0.5 = 50%)
  amount_g     numeric,      -- 실제 적립된 추가 감축량(g)
  rank_no      int,          -- 순위 (해당 없으면 null)
  settled      boolean       -- true=확정 적립 / false=진행 중(예정, 성장 미반영)
)
language sql
stable
security definer
set search_path = public
as $$
  with tgt as (
    select coalesce(s.target_co2_kg, 5) * 1000 as tg from public.settings s where s.id = 1
  ),
  totals as (
    -- 누적 감축량(수확 도달자 판별용) — 07번 파일과 같은 기준
    select c.user_id as tuid, sum(c.co2_reduced_g) as tot
    from public.certifications c
    where c.status = 'approved'
    group by c.user_id
  ),
  weekly as (
    -- 사용자·주별 감축량 (한국시간 월요일 시작)
    select c.user_id as wuid,
           date_trunc('week', (c.created_at at time zone 'Asia/Seoul')) as wk,
           sum(c.co2_reduced_g) as wg
    from public.certifications c
    where c.status = 'approved'
    group by c.user_id, date_trunc('week', (c.created_at at time zone 'Asia/Seoul'))
  ),
  ranked as (
    -- 수확 도달자(목표 달성)는 랭킹·보너스에서 제외
    select w.wuid, w.wk, w.wg,
           row_number() over (partition by w.wk order by w.wg desc) as rn
    from weekly w
    join totals t on t.tuid = w.wuid
    where t.tot < (select tg from tgt)
  ),
  cur as (
    select date_trunc('week', (now() at time zone 'Asia/Seoul')) as cw
  )
  -- ▼ 보너스 ① 주간 랭킹 상위 3명 +50%
  select
    r.wuid,
    'weekly_rank'::text,
    ('주간 랭킹 ' || r.rn || '위')::text,
    ('해당 주 감축량 ' || round(r.wg / 1000.0, 2) || 'kg 의 50%')::text,
    (r.wk)::date,
    (r.wk + interval '6 days')::date,
    ((r.wk + interval '7 days') at time zone 'Asia/Seoul'),
    r.wg,
    0.5::numeric,
    r.wg * 0.5,
    r.rn::int,
    (r.wk < (select cw from cur))
  from ranked r
  where r.rn <= 3;
  -- ▼ 보너스 ② 앞으로 추가될 제도는 여기에 union all 로 붙이면 됩니다.
$$;

revoke execute on function public.bonus_awards_all() from public, anon, authenticated;

-- -------------------------------------------------------------
-- 2) 내 보너스 내역 (로그인한 본인 것만) — /my 인증 내용 보기 화면용
-- -------------------------------------------------------------
create or replace function public.my_bonus_awards()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(json_build_object(
    'kind',         b.kind,
    'title',        b.title,
    'detail',       b.detail,
    'period_start', b.period_start,
    'period_end',   b.period_end,
    'awarded_at',   b.awarded_at,
    'base_g',       b.base_g,
    'amount_g',     b.amount_g,
    'rank_no',      b.rank_no,
    'settled',      b.settled
  ) order by b.settled desc, b.awarded_at desc, b.rank_no), '[]'::json)
  from public.bonus_awards_all() b
  where b.uid = auth.uid();
$$;

grant execute on function public.my_bonus_awards() to authenticated;

-- -------------------------------------------------------------
-- 3) 전체 보너스 내역 (관리자만) — /admin/certifications?status=bonus 화면용
--    관리자가 아니면 빈 목록을 돌려줍니다.
-- -------------------------------------------------------------
create or replace function public.admin_bonus_awards()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select case when public.is_admin() then (
    select coalesce(json_agg(json_build_object(
      'user_id',      b.uid,
      'name',         p.name,
      'username',     p.username,
      'kind',         b.kind,
      'title',        b.title,
      'detail',       b.detail,
      'period_start', b.period_start,
      'period_end',   b.period_end,
      'awarded_at',   b.awarded_at,
      'base_g',       b.base_g,
      'amount_g',     b.amount_g,
      'rank_no',      b.rank_no,
      'settled',      b.settled
    ) order by b.settled desc, b.awarded_at desc, b.rank_no), '[]'::json)
    from public.bonus_awards_all() b
    join public.profiles p on p.id = b.uid
  ) else '[]'::json end;
$$;

grant execute on function public.admin_bonus_awards() to authenticated;

-- -------------------------------------------------------------
-- 4) 실효 감축량 재정의 — 위 내역의 '확정된 보너스'만 더합니다.
--    (07번 파일의 함수를 대체. 계산 결과는 07번과 동일하지만,
--     이제 화면에 나열되는 내역과 100% 같은 값을 씁니다.)
-- -------------------------------------------------------------
create or replace function public.effective_reduction_g(uid uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select
    (select coalesce(sum(c.co2_reduced_g), 0)
       from public.certifications c
      where c.status = 'approved' and c.user_id = effective_reduction_g.uid)
    +
    (select coalesce(sum(b.amount_g), 0)
       from public.bonus_awards_all() b
      where b.uid = effective_reduction_g.uid and b.settled);
$$;

grant execute on function public.effective_reduction_g(uuid) to anon, authenticated;

-- =============================================================
--  끝. "Success. No rows returned"이 나오면 정상입니다.
-- =============================================================
