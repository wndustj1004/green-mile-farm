// 메인페이지 고정 섹션의 편집 가능한 텍스트 필드 정의 (관리자 '랜딩 내용'에서 수정)
// DB(site_texts)에 값이 없으면 여기 def(현재 문구)를 그대로 사용합니다.

export type SiteTextField = {
  key: string
  group: string
  label: string
  def: string
  multiline?: boolean
}

export const SITE_TEXT_FIELDS: SiteTextField[] = [
  // Hero
  { key: 'hero.badge', group: 'Hero', label: '상단 배지', def: 'GREEN MILE' },
  { key: 'hero.title', group: 'Hero', label: '헤드라인', def: '걸을수록 자라는\n나만의 친환경 텃밭', multiline: true },
  { key: 'hero.mission', group: 'Hero', label: '미션 문구', def: '걷기·자전거·대중교통으로 줄인 CO₂만큼 방울토마토가 자라요.\n다 키우면 G.P.S가 직접 키운 진짜 작물을 받아요! 🍅', multiline: true },

  // 참여 4단계
  { key: 'steps.label', group: '참여 4단계', label: '라벨', def: 'HOW IT WORKS' },
  { key: 'steps.title', group: '참여 4단계', label: '제목', def: '이렇게 참여해요' },
  { key: 'steps.s1_title', group: '참여 4단계', label: '1단계 제목', def: '회원가입' },
  { key: 'steps.s1_desc', group: '참여 4단계', label: '1단계 설명', def: '진짜 작물을 배송받으실 주소를 입력해주세요. 목표에 도달하면 수확 시기에 맞춰 배송 안내 문자를 보내드려요. 입력하신 주소·연락처는 챌린지 보상 배송 목적으로만 사용되며, 챌린지 종료 후 3개월이 지나면 안전하게 파기됩니다.', multiline: true },
  { key: 'steps.s2_title', group: '참여 4단계', label: '2단계 제목', def: '이동 인증' },
  { key: 'steps.s2_desc', group: '참여 4단계', label: '2단계 설명', def: '걷기·자전거·대중교통으로 이동한 구간을 지도와 사진으로 인증해요. (아래 가이드 참고)', multiline: true },
  { key: 'steps.s3_title', group: '참여 4단계', label: '3단계 제목', def: '작물 성장' },
  { key: 'steps.s3_desc', group: '참여 4단계', label: '3단계 설명', def: '줄인 CO₂만큼 내 방울토마토가 5단계로 자라요.', multiline: true },
  { key: 'steps.s4_title', group: '참여 4단계', label: '4단계 제목', def: '실물 보상' },
  { key: 'steps.s4_desc', group: '참여 4단계', label: '4단계 설명', def: '목표에 도달하면 G.P.S가 키운 진짜 작물을 받아요.', multiline: true },

  // 이동 인증 가이드
  { key: 'guide.label', group: '이동 인증 가이드', label: '라벨', def: 'GUIDE' },
  { key: 'guide.title', group: '이동 인증 가이드', label: '제목', def: '이동 인증, 이렇게 해요' },
  { key: 'guide.t1_title', group: '이동 인증 가이드', label: '카드1 제목', def: '교통수단 선택' },
  { key: 'guide.t1_desc', group: '이동 인증 가이드', label: '카드1 설명', def: '이번에 이동한 수단(걷기·자전거·버스·지하철)을 골라요.', multiline: true },
  { key: 'guide.t2_title', group: '이동 인증 가이드', label: '카드2 제목', def: '지도에서 출발·도착 핀 찍기' },
  { key: 'guide.t2_desc', group: '이동 인증 가이드', label: '카드2 설명', def: '지도에 출발·도착 위치를 찍으면 이동 거리가 자동으로 계산돼요.', multiline: true },
  { key: 'guide.t3_title', group: '이동 인증 가이드', label: '카드3 제목', def: '사진 4장 올리기' },
  { key: 'guide.t3_desc', group: '이동 인증 가이드', label: '카드3 설명', def: '출발·도착 각각 ① 실제 공간 사진 ② 지도 앱 현재위치 스크린샷을 올려요.', multiline: true },
  { key: 'guide.t4_title', group: '이동 인증 가이드', label: '카드4 제목', def: '등록 완료!' },
  { key: 'guide.t4_desc', group: '이동 인증 가이드', label: '카드4 설명', def: '줄인 CO₂만큼 내 작물이 쑥쑥 자라요.', multiline: true },

  // 실시간 임팩트
  { key: 'impact.label', group: '실시간 임팩트', label: '라벨', def: 'OUR IMPACT' },
  { key: 'impact.title', group: '실시간 임팩트', label: '제목', def: '함께 만드는 변화' },
  { key: 'impact.l_participants', group: '실시간 임팩트', label: '카드 라벨(참여자)', def: '함께한 참여자' },
  { key: 'impact.l_co2', group: '실시간 임팩트', label: '카드 라벨(감축)', def: '함께 줄인 CO₂' },
  { key: 'impact.l_harvest', group: '실시간 임팩트', label: '카드 라벨(수확)', def: '작물 수확 달성' },
  { key: 'impact.l_target', group: '실시간 임팩트', label: '카드 라벨(목표)', def: '1인 목표 감축량' },
  { key: 'impact.cta', group: '실시간 임팩트', label: 'CTA 버튼(비로그인)', def: '챌린지 참여하기' },

  // 작물 보상
  { key: 'reward.label', group: '작물 보상', label: '라벨', def: 'REWARD' },
  { key: 'reward.title', group: '작물 보상', label: '제목', def: '목표 5kg 달성 시,\n진짜 작물을 받아요!', multiline: true },
  { key: 'reward.bullet1', group: '작물 보상', label: '항목1', def: '🌱 커피박(커피 찌꺼기) 퇴비로 기른 방울토마토와 스위트 바질', multiline: true },
  { key: 'reward.bullet2', group: '작물 보상', label: '항목2', def: '🐝 비닐 대신 여러 번 재사용 가능한 밀랍랩에 포장해 배송', multiline: true },
  { key: 'reward.item1', group: '작물 보상', label: '보상 이름1', def: '방울토마토' },
  { key: 'reward.item2', group: '작물 보상', label: '보상 이름2', def: '스위트 바질' },
  { key: 'reward.item3', group: '작물 보상', label: '보상 이름3', def: '밀랍랩' },
  { key: 'reward.item4', group: '작물 보상', label: '보상 이름4', def: '커피박 퇴비' },

  // G.P.S 소개
  { key: 'gps.badge', group: 'G.P.S 소개', label: '배지', def: '전남대학교 환경에너지공학과 환경봉사 동아리' },
  { key: 'gps.title', group: 'G.P.S 소개', label: '헤드라인', def: '그린마일 팜을 만든 사람들,\nG.P.S 입니다', multiline: true },
  { key: 'gps.intro', group: 'G.P.S 소개', label: '소개문', def: 'G.P.S(Green Partner Society)는 2016년 창립 이래 전남대학교 환경에너지공학과 재학생들이 이끌어온 환경봉사 동아리입니다. 단순한 환경 정화 활동을 넘어, 환경·에너지 공학을 공부하는 예비 공학도로서 지역이 마주한 자원순환·탄소중립 문제에 직접 개입하고 실천적인 해결책을 제시하는 것을 목표로 활동하고 있습니다.', multiline: true },
  { key: 'gps.stat1_value', group: 'G.P.S 소개', label: '통계1 값', def: '2016' },
  { key: 'gps.stat1_label', group: 'G.P.S 소개', label: '통계1 라벨', def: '동아리 창립연도' },
  { key: 'gps.stat2_value', group: 'G.P.S 소개', label: '통계2 값', def: '99명' },
  { key: 'gps.stat2_label', group: 'G.P.S 소개', label: '통계2 라벨', def: '전체 회원수' },
  { key: 'gps.stat3_value', group: 'G.P.S 소개', label: '통계3 값', def: '환경에너지공학과' },
  { key: 'gps.stat3_label', group: 'G.P.S 소개', label: '통계3 라벨', def: '소속 학과' },
  { key: 'gps.act1_label', group: 'G.P.S 소개', label: '활동1 라벨', def: '자체 활동' },
  { key: 'gps.act1_title', group: 'G.P.S 소개', label: '활동1 제목', def: '일상의 광주를 더욱 깨끗하게' },
  { key: 'gps.act1_body', group: 'G.P.S 소개', label: '활동1 본문', def: '무등산 등산로, 전남대 캠퍼스, 자전거 도로 등 부원들이 일상에서 이용하는 공간을 직접 찾아 정화합니다. 무등산 플로깅, 교내 플로깅·분리배출 캠페인, 캠퍼스 자전거 도로 플로깅을 자체적으로 기획하고 운영하고 있습니다.', multiline: true },
  { key: 'gps.act2_label', group: 'G.P.S 소개', label: '활동2 라벨', def: '지역 연계 활동' },
  { key: 'gps.act2_title', group: 'G.P.S 소개', label: '활동2 제목', def: '북구자원봉사센터와 함께' },
  { key: 'gps.act2_body', group: 'G.P.S 소개', label: '활동2 본문', def: '광주광역시 북구자원봉사센터와 연계해 지역사회를 위한 봉사를 이어갑니다. 장마철 하수구 예찰 및 침수 피해 복구, 지역 행사 운영 보조 등 지역 주민의 안전과 일상을 지키는 활동에 함께하고 있습니다.', multiline: true },
  { key: 'gps.bottom', group: 'G.P.S 소개', label: '하단 문구', def: '그린마일 팜 챌린지는 광주광역시 자원봉사센터 단체 자원봉사 프로그램 “함께 그린(Green) 광주” 공모 사업의 일환으로, 환경 및 에너지 공학의 지식을 지역 사회에 환원하기 위한 G.P.S의 첫 시민 참여형 프로젝트입니다.', multiline: true },
  { key: 'gps.insta_label', group: 'G.P.S 소개', label: '인스타 버튼 문구', def: 'G.P.S 인스타그램 보기 →' },

  // CTA / 푸터
  { key: 'cta.title', group: 'CTA · 푸터', label: 'CTA 제목', def: '오늘부터,\n친환경 한 걸음을 시작해요', multiline: true },
  { key: 'cta.button', group: 'CTA · 푸터', label: 'CTA 버튼(비로그인)', def: '회원가입하기' },
  { key: 'footer.text', group: 'CTA · 푸터', label: '푸터', def: '🌿 그린마일 팜 · G.P.S' },
]

// 메인페이지 고정 섹션의 편집 가능한 이미지 필드 (URL을 site_texts에 저장)
export type SiteImageField = { key: string; group: string; label: string }

export const SITE_IMAGE_FIELDS: SiteImageField[] = [
  { key: 'guide.img_map', group: '이동 인증 가이드', label: '지도 스크린샷 예시 (STEP 2·3에 표시)' },
  { key: 'guide.img_place', group: '이동 인증 가이드', label: '실제 공간 사진 예시 (STEP 3에 표시)' },
]

export type SiteTexts = Record<string, string>

export function resolveSiteTexts(rows: { key: string; value: string }[] | null): SiteTexts {
  const db = new Map((rows ?? []).map((r) => [r.key, r.value]))
  const out: SiteTexts = {}
  for (const f of SITE_TEXT_FIELDS) out[f.key] = db.get(f.key) ?? f.def
  for (const f of SITE_IMAGE_FIELDS) out[f.key] = db.get(f.key) ?? ''
  return out
}
