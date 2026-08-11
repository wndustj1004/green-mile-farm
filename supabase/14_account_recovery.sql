-- =============================================================
--  그린마일 팜 — 아이디 찾기 / 비밀번호 재설정 (계정 복구)
--
--  실행 위치: Supabase 대시보드 > SQL Editor > New query > 붙여넣기 > Run
--  여러 번 다시 실행해도 안전합니다. (기존 데이터는 지워지지 않습니다)
--
--  ★ 이 파일은 기존 표(profiles, certifications, settings 등)를
--    절대 수정·삭제하지 않습니다. 새 표 2개만 추가합니다.
--
--  무엇을 하나요?
--   ① recovery_attempts    — 아이디/비번 찾기 시도 기록 (무차별 대입 차단용)
--   ② password_reset_tokens — 본인확인 통과 후 발급하는 10분짜리 1회용 열쇠
-- =============================================================


-- -------------------------------------------------------------
-- 1) 표: recovery_attempts — 찾기 시도가 있을 때마다 1줄씩 쌓입니다.
--    같은 사람이 10분 안에 5번 틀리면 잠깐 막기 위해 사용합니다.
-- -------------------------------------------------------------
create table if not exists public.recovery_attempts (
  id           bigint generated always as identity primary key,
  kind         text not null                                  -- 어떤 기능이었나
                 check (kind in ('find_id', 'reset_pw')),      --   find_id=아이디찾기 / reset_pw=비번재설정
  attempt_key  text not null,                                  -- 시도자 구분값(이메일 또는 접속 IP)
  success      boolean not null default false,                 -- 본인확인 성공 여부
  attempted_at timestamptz not null default now()
);

-- "최근 10분간 이 사람이 몇 번 틀렸나"를 빠르게 세기 위한 색인
create index if not exists recovery_attempts_lookup_idx
  on public.recovery_attempts (kind, attempt_key, attempted_at desc);


-- -------------------------------------------------------------
-- 2) 표: password_reset_tokens — 본인확인을 통과한 사람에게만 주는 임시 열쇠.
--    ★ 열쇠 원본은 저장하지 않고 '지문(해시)'만 저장합니다.
--      → 이 표가 통째로 새어나가도 남의 비밀번호를 바꿀 수 없습니다.
-- -------------------------------------------------------------
create table if not exists public.password_reset_tokens (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,                     -- 열쇠의 지문(SHA-256)
  expires_at timestamptz not null,                     -- 만료 시각(발급 후 10분)
  used_at    timestamptz,                              -- 사용된 시각(1회용 — 쓰면 채워짐)
  created_at timestamptz not null default now()
);

create index if not exists password_reset_tokens_user_idx
  on public.password_reset_tokens (user_id);


-- -------------------------------------------------------------
-- 3) 보안 규칙(RLS)
--    두 표 모두 "정책을 하나도 만들지 않습니다."
--    → 일반 사용자·로그인 사용자 누구도 조회/기록할 수 없고,
--      서버(서비스 롤 키)만 접근할 수 있습니다. 가장 안전한 상태입니다.
-- -------------------------------------------------------------
alter table public.recovery_attempts      enable row level security;
alter table public.password_reset_tokens  enable row level security;

-- 혹시 예전에 만들어 둔 정책이 있다면 제거(재실행 안전)
drop policy if exists "recovery_attempts_none"     on public.recovery_attempts;
drop policy if exists "password_reset_tokens_none" on public.password_reset_tokens;

-- 일반/로그인 사용자의 직접 접근 권한도 회수
revoke all on public.recovery_attempts     from anon, authenticated;
revoke all on public.password_reset_tokens from anon, authenticated;


-- =============================================================
--  끝. 실행 후 "Success. No rows returned"이 나오면 정상입니다.
-- =============================================================
