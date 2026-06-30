-- =============================================================
--  그린마일 팜 — 랜딩 페이지 소개 섹션 (관리자 편집형 CMS)
--  실행 위치: Supabase 대시보드 > SQL Editor > New query > 붙여넣기 > Run
--  여러 번 다시 실행해도 안전합니다.
-- =============================================================

-- 1) 테이블: landing_sections (메인페이지 아래 스크롤 소개 섹션. 1행 = 1섹션)
create table if not exists public.landing_sections (
  id          uuid primary key default gen_random_uuid(),
  sort_order  int  not null default 0,        -- 화면에 보이는 순서(작을수록 위)
  emoji       text not null default '🌿',      -- 섹션 아이콘
  title       text not null default '',        -- 섹션 제목
  body        text not null default '',        -- 섹션 본문(줄바꿈 그대로 표시)
  visible     boolean not null default true,   -- 화면 표시 여부(끄면 숨김)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2) 보안 규칙(RLS) — 소개글은 누구나 조회, 수정은 관리자만
alter table public.landing_sections enable row level security;

drop policy if exists "landing_select_all" on public.landing_sections;
create policy "landing_select_all" on public.landing_sections
  for select using (true);

drop policy if exists "landing_write_admin" on public.landing_sections;
create policy "landing_write_admin" on public.landing_sections
  for all using (public.is_admin()) with check (public.is_admin());

-- 3) 초기 섹션 4개 — 테이블이 비어 있을 때만 넣음(재실행해도 중복 안 됨)
insert into public.landing_sections (sort_order, emoji, title, body)
select * from (values
  (1, '🌱', 'G.P.S 동아리 소개',
   'G.P.S는 지속가능한 도시를 함께 만들어가는 학생 동아리입니다. 우리는 일상 속 작은 실천이 모이면 도시의 탄소를 의미 있게 줄일 수 있다고 믿습니다.

그린마일 팜 챌린지는 걷기·자전거·대중교통 같은 친환경 이동을 인증하면, 줄인 CO₂만큼 가상 작물이 자라고 끝까지 키우면 실제 작물로 보상받는 참여형 캠페인입니다.

(이 소개 글은 관리자 페이지 > 랜딩 내용 에서 자유롭게 수정할 수 있습니다.)'),
  (2, '🏆', '그린 광주 공모사업',
   '이 챌린지는 더 푸르고 지속가능한 광주를 만들기 위한 시민 참여 프로젝트로 진행됩니다.

시민 한 사람 한 사람의 친환경 이동이 도시 전체의 탄소 감축으로 이어지도록 설계되었습니다.

(공모사업의 정확한 취지·주최·지원 내용을 관리자 페이지에서 채워주세요.)'),
  (3, '🚍', '친환경 대중교통 정책·현황',
   '광주광역시는 버스·지하철 등 대중교통과 자전거 이용을 늘려 교통부문 탄소를 줄이는 정책을 추진하고 있습니다.

승용차 대신 대중교통·자전거·걷기를 선택하면 1인당 배출하는 온실가스를 크게 낮출 수 있습니다.

(광주시의 구체적인 정책·노선·이용 현황 수치를 관리자 페이지에서 채워주세요.)'),
  (4, '🌍', '교통부문 온실가스',
   '온실가스 배출에서 이동(교통)이 차지하는 비중은 상당히 큽니다. 그중에서도 승용차는 같은 거리를 이동할 때 가장 많은 CO₂를 내뿜습니다.

그래서 "어떻게 이동하느냐"를 바꾸는 것만으로도 의미 있는 감축이 가능합니다. 이 챌린지는 바로 그 변화를 눈에 보이는 작물 성장으로 보여줍니다.

(정확한 통계와 출처를 관리자 페이지에서 보강해주세요.)')
) as v(sort_order, emoji, title, body)
where not exists (select 1 from public.landing_sections);

-- =============================================================
--  끝. "Success. No rows returned"이 나오면 정상입니다.
-- =============================================================
