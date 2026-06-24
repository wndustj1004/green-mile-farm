// 입력값 검증 규칙 (회원가입 폼과 서버에서 공통 사용)
export const RE = {
  phone: /^010-\d{4}-\d{4}$/,
  username: /^[a-zA-Z0-9_]{4,20}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
}

// 각 검증 함수: 통과하면 '' (빈 문자열), 실패하면 안내 메시지 반환
export function checkName(v: string): string {
  return v.trim() ? '' : '이름을 입력해주세요.'
}
export function checkPhone(v: string): string {
  return RE.phone.test(v) ? '' : '010-0000-0000 형식으로 입력해주세요.'
}
export function checkUsername(v: string): string {
  return RE.username.test(v) ? '' : '영문·숫자 4~20자로 입력해주세요.'
}
export function checkPassword(v: string): string {
  return v.length >= 8 ? '' : '비밀번호는 8자 이상이어야 합니다.'
}
export function checkPasswordConfirm(pw: string, confirm: string): string {
  return pw === confirm ? '' : '비밀번호가 일치하지 않습니다.'
}
export function checkAddress(v: string): string {
  return v.trim() ? '' : '주소를 입력해주세요.'
}
export function checkEmail(v: string): string {
  return RE.email.test(v) ? '' : '이메일 형식이 올바르지 않습니다.'
}
