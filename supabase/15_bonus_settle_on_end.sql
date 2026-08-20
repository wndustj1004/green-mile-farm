-- =============================================================
--  그린마일 팜 — 챌린지 마감 후 주간 랭킹 보너스 즉시 확정 (15)
--
--  [무엇을 바꾸나]
--  기존 규칙: 주간 랭킹 보너스는 "그 주가 끝나야" 확정(settled)됐습니다.
--  → 챌린지가 주 중간(2026-08-20 목)에 끝나면, 마지막 주(8/17~8/23)는
--    일요일까지 기다려야 확정되는 문제가 있었습니다.
--    하지만 마감일이 지나면 더 이상 인증이 들어올 수 없으므로 순위가 이미 확정입니다.
--
--  새 규칙: 아래 둘 중 하나라도 참이면 확정.
--    ① 그 주가 이미 끝났다            (기존과 동일)
--    ② 챌린지 마감일이 지났다          (오늘 KST > settings.challenge_end)  ← 추가
--
--  [효과] 2026-08-21 기준 마지막 주(8/17~8/23) 보너스 3건이 즉시 확정됩니다.
--  [자동] 관리자가 settings.challenge_end 를 바꾸면 이 규칙도 따라 움직입니다.
--         (마감일을 뒤로 미루면 다시 '적립 예정'으로 돌아갑니다 — 의도된 동작)
--
--  [12·13번과의 관계] bonus_awards_all() 을 통째로 다시 정의합니다.
--  12·13을 재실행할 필요 없이 이 파일만 실행하면 됩니다.
--  보너스 ①(주간 랭킹) ②(steady♡) 내용 자체는 그대로입니다.
--
--  실행 위치: Supabase 대시보드 > SQL Editor > New query > 붙여넣기 > Run
-- =============================================================

create or replace function public.bonus_awards_all()
returns table (
  uid          uuid,         -- 받은 사람
  kind         text,         -- 보너스 종류 코드 ('weekly_rank' | 'steady3')
  title        text,         -- 화면에 보일 이름
  detail       text,         -- 산정 근거 한 줄 설명
  period_start date,         -- 대상 기간 시작
  period_end   date,         -- 대상 기간 끝
  awarded_at   timestamptz,  -- 적립 확정 시각
  base_g       numeric,      -- 산정 기준 감축량(g) — 해당 없으면 null
  rate         numeric,      -- 적립 비율 — 해당 없으면 null
  amount_g     numeric,      -- 실제 적립된 추가 감축량(g)
  rank_no      int,          -- 순위 — 해당 없으면 null
  settled      boolean       -- true=확정 적립 / false=진행 중(예정, 성장 미반영)
)
language sql
stable
security definer
set search_path = public
as $$
  with cfg as (
    -- ▼ steady♡ 기준값: 몇 회 달성 시 / 몇 g 지급
    select 3 as need_n, 1000::numeric as bonus_g
  ),
  tgt as (
    select coalesce(s.target_co2_kg, 5) * 1000 as tg from public.settings s where s.id = 1
  ),
  cur as (
    -- 이번 주 시작 / 오늘 / 챌린지 마감일 (모두 한국시간 기준)
    -- 마감일이 비어 있으면 'infinity' 로 둬서 "아직 안 끝남"으로 처리
    select date_trunc('week', (now() at time zone 'Asia/Seoul')) as cw,
           (now() at time zone 'Asia/Seoul')::date               as today,
           (select coalesce(s.challenge_end, 'infinity'::date)
              from public.settings s where s.id = 1)             as ce
  ),
  totals as (
    -- 누적 감축량(수확 도달자 판별용) — 보너스는 빼고 인증분만. 순환 참조 방지.
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
    -- 수확 도달자(목표 달성)는 주간 랭킹·보너스에서 제외
    select w.wuid, w.wk, w.wg,
           row_number() over (partition by w.wk order by w.wg desc) as rn
    from weekly w
    join totals t on t.tuid = w.wuid
    where t.tot < (select tg from tgt)
  ),
  seq as (
    -- 사람별 승인 인증에 1,2,3... 번호 매기기 (올린 시각 순)
    select c.user_id as suid,
           c.created_at as sat,
           row_number() over (partition by c.user_id order by c.created_at, c.id) as sn
    from public.certifications c
    where c.status = 'approved'
  ),
  steady as (
    -- 3번째 인증에 도달한 사람 = 첫 인증 시각 + 3번째 인증 시각
    select s3.suid, s1.sat as first_at, s3.sat as third_at
    from seq s3
    join seq s1 on s1.suid = s3.suid and s1.sn = 1
    where s3.sn = (select need_n from cfg)
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
    -- ★ 변경점: 그 주가 끝났거나(①) 챌린지 마감일이 지났으면(②) 확정
    ( (r.wk < (select cw from cur))
      or ((select today from cur) > (select ce from cur)) )
  from ranked r
  where r.rn <= 3

  union all

  -- ▼ 보너스 ② 우리 관계 steady♡ — 누적 인증 3회 달성 시 1kg (1인 1회)
  select
    st.suid,
    'steady3'::text,
    '우리 관계 steady♡'::text,
    ('승인된 인증 ' || (select need_n from cfg) || '회 달성 · 첫 인증 ~ ' ||
      (select need_n from cfg) || '번째 인증까지 (1인 1회)')::text,
    (st.first_at at time zone 'Asia/Seoul')::date,
    (st.third_at at time zone 'Asia/Seoul')::date,
    st.third_at,
    null::numeric,
    null::numeric,
    (select bonus_g from cfg),
    null::int,
    true
  from steady st;

  -- ▼ 보너스 ③ 앞으로 추가될 제도는 여기에 union all 로 또 붙이면 됩니다.
$$;

revoke execute on function public.bonus_awards_all() from public, anon, authenticated;

-- =============================================================
--  끝. "Success. No rows returned"이 나오면 정상입니다.
--  확인: node --env-file=.env.local scripts/check-bonus.mjs
-- =============================================================
