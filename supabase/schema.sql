-- =============================================================
--  그린마일 팜 — 데이터베이스 설계도 (Supabase SQL Editor에 붙여넣어 실행)
--  실행 위치: Supabase 대시보드 > 왼쪽 메뉴 'SQL Editor' > New query > 붙여넣기 > Run
--  여러 번 다시 실행해도 안전하도록 작성했습니다.
-- =============================================================

-- -------------------------------------------------------------
-- 1) 테이블: profiles (회원 정보) — Supabase Auth의 로그인 계정과 1:1 연결
-- -------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  username       text unique not null,                 -- 아이디 (중복 불가)
  name           text not null,                        -- 이름(닉네임)
  phone          text not null,                        -- 핸드폰 번호 (상품 수령 안내)
  address        text not null,                        -- 주소 (상품 수령)
  email          text not null,                        -- 이메일 (대체 알림)
  age_confirmed  boolean not null default false,       -- 만 14세 이상 확인
  privacy_agreed boolean not null default false,       -- 개인정보 수집·이용 동의
  is_admin       boolean not null default false,       -- 관리자 여부 (운영진만 true)
  created_at     timestamptz not null default now()
);

-- -------------------------------------------------------------
-- 2) 테이블: certifications (인증 내역) — 인증 1건 = 1행
-- -------------------------------------------------------------
create table if not exists public.certifications (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  transport     text not null check (transport in ('walk','bike','bus','subway')), -- 걷기/자전거/버스/지하철
  start_address text,                                  -- 시작 위치(주소 또는 설명)
  end_address   text,                                  -- 종료 위치
  distance_km   numeric not null,                      -- 이동 거리(km)
  co2_reduced_g numeric not null,                      -- 감축량(g CO2)
  start_photo_1 text,                                  -- 사진 경로(Storage)
  start_photo_2 text,
  end_photo_1   text,
  end_photo_2   text,
  exif_data     jsonb,                                 -- 사진 메타데이터(촬영시각·GPS)
  status        text not null default 'approved'       -- 자동 승인 + 운영진 사후 반려 구조
                 check (status in ('approved','rejected')),
  created_at    timestamptz not null default now()
);

create index if not exists certifications_user_id_idx on public.certifications(user_id);

-- -------------------------------------------------------------
-- 3) 테이블: settings (전역 설정) — 항상 1행만 존재. 관리자가 수정.
--    목표 감축량/일정/배출계수를 코드 수정 없이 바꿀 수 있게 보관.
--    아래 배출계수는 모두 '임시값' — 전공팀이 공식값 확정 시 교체.
-- -------------------------------------------------------------
create table if not exists public.settings (
  id              int primary key default 1,
  target_co2_kg   numeric not null default 5,          -- 목표 감축량(kg) — 확정 5kg
  challenge_start date    default '2026-07-06',         -- 챌린지 시작일
  challenge_end   date    default '2026-07-26',         -- 챌린지 종료일
  car_emission    numeric not null default 210,        -- 승용차 배출계수 g/km (기준)
  walk_emission   numeric not null default 0,          -- 걷기
  bike_emission   numeric not null default 0,          -- 자전거
  bus_emission    numeric not null default 27.7,       -- 버스
  subway_emission numeric not null default 1.53,       -- 지하철
  updated_at      timestamptz not null default now(),
  constraint settings_single_row check (id = 1)
);

insert into public.settings (id) values (1) on conflict (id) do nothing;

-- -------------------------------------------------------------
-- 4) 사진 저장소(Storage) 버킷 — 비공개
-- -------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('certification-photos', 'certification-photos', false)
on conflict (id) do nothing;

-- -------------------------------------------------------------
-- 5) 관리자 판별 함수 (RLS 무한루프 방지용 — security definer)
-- -------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- -------------------------------------------------------------
-- 6) 회원가입 시 profiles 자동 생성 트리거
--    회원가입(signUp) 때 넘긴 추가정보(raw_user_meta_data)를 읽어 한 행 생성.
-- -------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, name, phone, address, email, age_confirmed, privacy_agreed)
  values (
    new.id,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'address',
    new.email,
    coalesce((new.raw_user_meta_data->>'age_confirmed')::boolean, false),
    coalesce((new.raw_user_meta_data->>'privacy_agreed')::boolean, false)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -------------------------------------------------------------
-- 7) 보안 규칙(RLS) — "누가 어떤 행을 보고/바꿀 수 있나"
-- -------------------------------------------------------------
alter table public.profiles       enable row level security;
alter table public.certifications enable row level security;
alter table public.settings       enable row level security;

-- profiles: 본인 또는 관리자만 조회 / 수정은 관리자만
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());

-- certifications: 본인은 등록·조회 / 관리자는 전체 조회·수정(반려)
drop policy if exists "cert_insert_own" on public.certifications;
create policy "cert_insert_own" on public.certifications
  for insert with check (auth.uid() = user_id);

drop policy if exists "cert_select" on public.certifications;
create policy "cert_select" on public.certifications
  for select using (auth.uid() = user_id or public.is_admin());

drop policy if exists "cert_update_admin" on public.certifications;
create policy "cert_update_admin" on public.certifications
  for update using (public.is_admin());

-- settings: 누구나 조회(목표·계수 필요) / 수정은 관리자만
drop policy if exists "settings_select_all" on public.settings;
create policy "settings_select_all" on public.settings
  for select using (true);

drop policy if exists "settings_update_admin" on public.settings;
create policy "settings_update_admin" on public.settings
  for update using (public.is_admin());

-- Storage(사진): 본인 폴더에만 업로드 / 본인·관리자만 열람
drop policy if exists "photos_insert_own" on storage.objects;
create policy "photos_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'certification-photos'
              and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "photos_select_own_or_admin" on storage.objects;
create policy "photos_select_own_or_admin" on storage.objects
  for select to authenticated
  using (bucket_id = 'certification-photos'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- =============================================================
--  끝. 실행 후 "Success. No rows returned"이 나오면 정상입니다.
-- =============================================================
