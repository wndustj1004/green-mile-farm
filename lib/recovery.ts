// 아이디 찾기 / 비밀번호 재설정에서 서버·클라이언트가 함께 쓰는 규칙.
// (서버 전용 코드는 여기에 넣지 마세요 — 회원가입 폼처럼 브라우저에서도 import 합니다)

/** 본인확인 실패 시 항상 이 문장만 보여줍니다.
 *  "이름은 맞는데 번호가 틀렸다" 같은 힌트를 주면 남의 정보를 캐낼 수 있어서,
 *  어느 항목이 틀렸는지 구분하지 않습니다. */
export const NO_MATCH_MSG =
  '입력하신 정보와 일치하는 회원이 없습니다. 회원가입 때 적으신 내용 그대로 입력했는지 확인해주세요.'

/** 너무 많이 시도했을 때 보여줄 문장 */
export const TOO_MANY_MSG =
  '본인확인 시도가 너무 많습니다. 10분 뒤에 다시 시도하거나 운영진에게 문의해주세요.'

/** 무차별 대입 차단 기준 — 10분 안에 5번 실패하면 잠시 막습니다. */
export const RATE_LIMIT = { windowMinutes: 10, maxFails: 5 }

/** 본인확인 통과 후 발급되는 임시 열쇠의 유효시간(분) */
export const RESET_TOKEN_MINUTES = 10

/** 휴대폰 번호를 숫자만 남겨 비교합니다.
 *  (010-1234-5678 / 01012345678 / 010 1234 5678 을 모두 같은 값으로 취급) */
export function phoneDigits(v: string): string {
  return (v || '').replace(/\D/g, '')
}

/** 입력한 휴대폰 번호를 010-0000-0000 모양으로 정리 (회원가입 폼과 동일 규칙) */
export function formatPhone(v: string): string {
  const d = phoneDigits(v).slice(0, 11)
  if (d.length > 7) return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`
  if (d.length > 3) return `${d.slice(0, 3)}-${d.slice(3)}`
  return d
}

/** 이메일 비교용 정리 — 앞뒤 공백 제거 + 소문자 통일 */
export function normEmail(v: string): string {
  return (v || '').trim().toLowerCase()
}

/** 이름 비교용 정리 — 앞뒤/중간 공백 제거 + 소문자 통일
 *  ("홍 길동"으로 적었다가 "홍길동"으로 찾는 경우를 구제) */
export function normName(v: string): string {
  return (v || '').replace(/\s+/g, '').toLowerCase()
}
