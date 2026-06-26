// ════════════════════════════════════════════════════════
//  공부멘탈지수 — 문항 데이터 & 점수 계산
//  [코드리뷰 수정사항]
//  - renderCategoryBars의 dead code (const { toMentalIndex: tmi }) 제거
//  - aggregateScores에서 '전체' 계산시 종합 카테고리가 이중집계되던 버그 없음 확인
//    (catSum은 카테고리별 독립 누적, totalSum은 전체 문항 별도 누적이므로 정상)
//  - toMentalIndex clamp 범위 40~160 유지
//  - NORM 값: 실제 43명 데이터 기반 (mean=62.53%, std=14.23%)
// ════════════════════════════════════════════════════════

export const CATEGORIES = {
  관리: { label: '관리', color: '#6366f1', desc: '전반적인 공부 스트레스와 태도' },
  '인정(사랑)': { label: '인정', color: '#ec4899', desc: '인정과 칭찬에 대한 의존도' },
  '가족(부모)': { label: '부모', color: '#f97316', desc: '부모님으로 인한 공부 스트레스' },
  친구: { label: '친구', color: '#22c55e', desc: '또래 관계가 공부에 미치는 영향' },
  미래: { label: '미래', color: '#3b82f6', desc: '미래 불안이 현재 공부에 미치는 영향' },
  자존심: { label: '자존심', color: '#a855f7', desc: '자존감과 경쟁 심리' },
  호감: { label: '호감', color: '#eab308', desc: '공부에 대한 긍정적 감정' },
  체감: { label: '체감', color: '#14b8a6', desc: '공부 방법론적 자신감 (체화된 능력)' },
  직감: { label: '직감', color: '#f43f5e', desc: '메타인지 능력 (나를 아는 감각)' },
};

// 설문 번호 순서 (1~50번 그대로)
export const QUESTIONS = [
  { id: 1, category: '체감', direction: '긍', text: '공부가 잘 되는 나만의 공부법이 있다.' },
  { id: 2, category: '인정(사랑)', direction: '부', text: '부모님이나 선생님께 칭찬 받기 위해 공부를 한다.' },
  { id: 3, category: '자존심', direction: '부', text: '티를 안 내도 공부나 성적 때문에 자존심이 상할 때가 있다.' },
  { id: 4, category: '직감', direction: '부', text: '내가 예상한 성적과 실제 성적이 차이 나는 경우가 많다.' },
  { id: 5, category: '자존심', direction: '부', text: '나는 지기 싫어서 공부한다.' },
  { id: 6, category: '미래', direction: '부', text: '공부를 하느라 미래를 꿈을 꿀 시간이 없다.' },
  { id: 7, category: '친구', direction: '부', text: '마음에 안 드는 친구들 때문에 스트레스를 받는다.' },
  { id: 8, category: '관리', direction: '긍', text: '나는 수업 시간에 졸거나 자지 않는다.' },
  { id: 9, category: '가족(부모)', direction: '부', text: '나는 부모님을 기쁘게 해드리기 위해 공부한다.' },
  { id: 10, category: '관리', direction: '부', text: '공부나 성적에 대해 좋은 기억이 별로 없다.' },
  { id: 11, category: '친구', direction: '부', text: '성적이나 공부 때문에 친구들과 문제가 생긴 적이 있다.' },
  { id: 12, category: '친구', direction: '긍', text: '성적이 많이 차이 나도 친한 친구가 될 수 있다.' },
  { id: 13, category: '관리', direction: '긍', text: '나는 머리가 좋다고 생각한다.' },
  { id: 14, category: '가족(부모)', direction: '긍', text: '우리 집은 전반적으로 분위기가 좋다.' },
  { id: 15, category: '호감', direction: '긍', text: '특별히 싫어하는 과목은 없다.' },
  { id: 16, category: '인정(사랑)', direction: '긍', text: '공부를 못해도 사람들은 나를 좋아할 것이다.' },
  { id: 17, category: '호감', direction: '부', text: '공부하다 힘들어서 운 적이 있다.' },
  { id: 18, category: '친구', direction: '부', text: '시험이나 성적 때문에 사이가 멀어진 친구들이 있다.' },
  { id: 19, category: '호감', direction: '부', text: '난 공부가 싫다.' },
  { id: 20, category: '체감', direction: '부', text: '공부를 해도 내가 원하는 성적이 안 나온다.' },
  { id: 21, category: '인정(사랑)', direction: '부', text: '학년이 올라갈수록 성적 좋은 친구들이 더 많은 사랑을 받을 것이다.' },
  { id: 22, category: '직감', direction: '긍', text: '영단어 100개를 외우기 위해 걸리는 시간을 대충 안다.' },
  { id: 23, category: '자존심', direction: '긍', text: '나는 자존감이 높은 편이다.' },
  { id: 24, category: '관리', direction: '부', text: '공부를 재밌다고 생각해본 적이 없다.' },
  { id: 25, category: '가족(부모)', direction: '긍', text: '학원을 결정할 때 부모님은 나에게 다니고 싶은지 꼭 물어보신다.' },
  { id: 26, category: '관리', direction: '부', text: '모르는 걸 들키기 싫어서 아는 척 한다.' },
  { id: 27, category: '미래', direction: '긍', text: '난 친구들에 비해 꿈과 미래를 자신있게 이야기하는 편이다.' },
  { id: 28, category: '체감', direction: '부', text: '공부가 잘 안 될 때 솔직히 어떻게 해야할지 모르겠다.' },
  { id: 29, category: '체감', direction: '긍', text: '난 좋은 성적을 받는 방법을 알고 있다.' },
  { id: 30, category: '미래', direction: '부', text: '어렸을 때부터 공부나 학원 등 해야하는 것들이 많았다.' },
  { id: 31, category: '미래', direction: '긍', text: '성적이 안 좋아도 미래에 내가 하고 싶은 것을 할 수 있을 것이다.' },
  { id: 32, category: '인정(사랑)', direction: '긍', text: '나는 친구들이나 가족들에게 인정받고 사랑받는다.' },
  { id: 33, category: '관리', direction: '긍', text: '대학 입시까지 공부 체력을 잘 유지할 수 있을 것이다.' },
  { id: 34, category: '호감', direction: '부', text: '공부가 재밌다고 하는 말은 기만이다.' },
  { id: 35, category: '관리', direction: '부', text: '공부하라는 이야기를 들으면 일단 기분이 나빠진다.' },
  { id: 36, category: '자존심', direction: '긍', text: '열심히 하면 분명 공부를 잘할 수 있을 것이다.' },
  { id: 37, category: '관리', direction: '부', text: '솔직히 공부를 어떻게 해야하는지 모르겠다.' },
  { id: 38, category: '인정(사랑)', direction: '부', text: '학교, 집, 학원에서 인정받는 것은 나에게 매우 중요하다.' },
  { id: 39, category: '관리', direction: '부', text: '공부하지 않을 때도 공부 스트레스를 받는다.' },
  { id: 40, category: '미래', direction: '부', text: '꿈이 없는데 자꾸 주변에서 정하라고 한다.' },
  { id: 41, category: '가족(부모)', direction: '부', text: '부모님에게 공부나 성적 때문에 상처를 받은 기억이 있다.' },
  { id: 42, category: '체감', direction: '부', text: '공부는 적게 하면서 성적 잘 나오는 애들은 재수없다.' },
  { id: 43, category: '관리', direction: '부', text: '학원 진도가 너무 빨라서 버겁다.' },
  { id: 44, category: '가족(부모)', direction: '긍', text: '성적이 떨어져도 부모님은 나를 똑같이 사랑할 것이다.' },
  { id: 45, category: '호감', direction: '긍', text: '분명 지금보다 공부가 더 좋아질 방법이 있을 것이다.' },
  { id: 46, category: '직감', direction: '부', text: '공부를 어느정도 해야 성적이 잘 나오는지 잘 모르겠다.' },
  { id: 47, category: '직감', direction: '긍', text: '내가 나올 거라 예상했던 문제들은 보통 시험에 나온다.' },
  { id: 48, category: '친구', direction: '긍', text: '나는 좋은 친구가 많다.' },
  { id: 49, category: '직감', direction: '부', text: '시험 공부를 며칠 정도 해야 하는지 잘 모르겠다.' },
  { id: 50, category: '자존심', direction: '부', text: '공부 잘하는 애들은 속으로 잘난 척하고 있을 것이다.' },
];

// ─── 점수 계산 ────────────────────────────────────────────
// value: 0=매우그렇다, 1=그렇다, 2=보통이다, 3=아니다, 4=매우아니다
// 긍정문항: 매우그렇다(4점) ~ 매우아니다(0점)
// 부정문항: 매우그렇다(0점) ~ 매우아니다(4점)
export function calcScore(question, value) {
  return question.direction === '긍' ? (4 - value) : value;
}

// 카테고리별 원점수를 0~100% 퍼센트로 집계
// [검증] totalSum/totalMax는 전체 200점(50문항×4점) 기준으로 독립 계산 → 이중집계 없음
export function aggregateScores(answers) {
  const catSum = {}, catMax = {};
  Object.keys(CATEGORIES).forEach(c => { catSum[c] = 0; catMax[c] = 0; });

  let totalSum = 0, totalMax = 0;

  QUESTIONS.forEach(q => {
    const v = answers[q.id];
    if (v === undefined || v === null) return;
    const s = calcScore(q, v);
    catSum[q.category] += s;
    catMax[q.category] += 4;
    totalSum += s;
    totalMax += 4;
  });

  const result = {};
  Object.keys(CATEGORIES).forEach(cat => {
    result[cat] = catMax[cat] > 0 ? (catSum[cat] / catMax[cat]) * 100 : null;
  });
  result['전체'] = totalMax > 0 ? (totalSum / totalMax) * 100 : 0;
  return result;
}

// ─── 표준화 (2026-04-30) ──────────
export const NORMS = {
  '전체': { mean: 58.20, std: 11.94 },
  '관리': { mean: 59.95, std: 12.40 },
  '호감': { mean: 59.67, std: 14.75 },
  '체감': { mean: 53.49, std: 19.13 },
  '직감': { mean: 55.42, std: 18.46 },
  '인정(사랑)': { mean: 63.49, std: 11.91 },
  '가족(부모)': { mean: 64.02, std: 12.67 },
  '친구': { mean: 71.14, std: 9.24 },
  '미래': { mean: 56.42, std: 17.19 },
  '자존심': { mean: 55.21, std: 15.79 }
};

// 웩슬러 방식: 정규분포 Z-score 사용 (100 + 15 * Z)
export function toMentalIndex(totalPct, category = '전체') {
  const norm = NORMS[category] || NORMS['전체'];
  const raw = 100 + 15 * (totalPct - norm.mean) / norm.std;
  return Math.round(Math.min(160, Math.max(40, raw)));
}

// ─── 등급 ────────────────────────────────────────────────
export const SCORE_LEVELS = [
  { min: 130, label: '매우 높음', color: '#6366f1' },
  { min: 115, label: '높음', color: '#22c55e' },
  { min: 85, label: '보통', color: '#eab308' },
  { min: 70, label: '낮음', color: '#f97316' },
  { min: 0, label: '매우 낮음', color: '#ef4444' },
];

export function getLevel(index) {
  return SCORE_LEVELS.find(l => index >= l.min) || SCORE_LEVELS[SCORE_LEVELS.length - 1];
}

// ─── 컬러 보간 (5점 단위 세분화 대응) ──────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}
function rgbToHex(r, g, b) {
  const toHex = (n) => Math.round(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getScoreColor(index) {
  // 기준점 정의 (index, hex)
  const stops = [
    { idx: 40,  hex: '#ef4444' }, // 매우 낮음 (시작)
    { idx: 70,  hex: '#f97316' }, // 낮음
    { idx: 85,  hex: '#eab308' }, // 보통
    { idx: 115, hex: '#22c55e' }, // 높음
    { idx: 130, hex: '#6366f1' }, // 매우 높음
    { idx: 160, hex: '#6366f1' }  // 끝
  ];

  if (index <= stops[0].idx) return stops[0].hex;
  if (index >= stops[stops.length - 1].idx) return stops[stops.length - 1].hex;

  // 현재 점수가 속한 구간 찾기
  for (let i = 0; i < stops.length - 1; i++) {
    const s1 = stops[i];
    const s2 = stops[i + 1];
    if (index >= s1.idx && index <= s2.idx) {
      const factor = (index - s1.idx) / (s2.idx - s1.idx);
      const c1 = hexToRgb(s1.hex);
      const c2 = hexToRgb(s2.hex);
      const r = c1[0] + (c2[0] - c1[0]) * factor;
      const g = c1[1] + (c2[1] - c1[1]) * factor;
      const b = c1[2] + (c2[2] - c1[2]) * factor;
      return rgbToHex(r, g, b);
    }
  }
  return stops[stops.length - 1].hex;
}

// 레포트용 카테고리 순서 (내적 요인: 호감, 체감, 직감, 관리 / 외적 요인: 나머지)
export const REPORT_CAT_ORDER = ['호감', '체감', '직감', '관리', '인정(사랑)', '가족(부모)', '친구', '미래', '자존심'];
