/* ══ 문항 ══ */
const QUESTIONS = [
  '◈ 나는 돈 때문에 자주 스트레스를 받는다.',
  '◈ 어렸을 때 가난에 대한 기억이 많다.',
  '◈ 나는 물건을 살 때 가격에 신경을 많이 쓴다.',
  '◈ 많은 돈을 벌기 위해 여러가지 노력을 하고 있다.',
  '◈ 여유있는 사람들을 보면 불공평하다고 느낀다.',
  '◈ 삶을 사는데 있어 사랑받고 사랑하는 것은 무엇보다 중요하다.',
  '◈ 나는 충분한 사랑을 받지 못하며 자랐다고 느낀다.',
  '◈ 누군가 나를 싫어하지 않는지 신경을 쓰며 산다.',
  '◈ 모든 사람들이 나를 좋아해줬으면 좋겠다.',
  '◈ 많은 사람들에게 사랑받으며 사는 사람이 부럽다.',
  '◈ 사람들에게 인정받는 것은 삶에 있어 중요한 가치다.',
  '◈ 칭찬받기 위해 무언가를 열심히 한 기억이 많다.',
  '◈ 나를 특히 기분 좋게 만드는 건 칭찬이나 인정을 받는 것이다.',
  '◈ 모두에게 인정받기 위해 많은 노력을 하고 있다.',
  '◈ 나는 유명해지고 싶다.',
  '◈ 나에게 자존심을 지켜내는 일은 대단히 중요하다.',
  '◈ 누군가 나의 자존심에 상처를 입혔던 일을 떠올리면 금방금방 떠오른다.',
  '◈ 자존감이 낮아질 때가 많지만 잘 표현하지 않는다.',
  '◈ 상처받지 않기 위해 내 마음을 방어하는 것 같다.',
  '◈ 자신감있고 당당하게 사는 사람들이 부럽다.',
  '◈ 삶에 있어 가장 중요한 것은 가족이라 생각한다.',
  '◈ 부모님에게 상처를 받은 기억이 종종 떠오른다.',
  '◈ 가족 및 친척은 나와 뗄레야 뗄 수 없는 관계이다.',
  '◈ 화목한 가정을 만드는 것은 나에게 대단히 중요하다.',
  '◈ 티비에 나오는 화목한 가족은 사실 불가능하다고 생각한다.',
  '◈ 하고 싶은 것과 미래에 대한 계획은 철저히 세워야 한다.',
  '◈ 나는 살면서 여러 의무 등 해야 하는 것들이 많았다.',
  '◈ 나는 버릴 수 없는 꿈이 있다.',
  '◈ 미래가 계획대로 진행되는 것은 나에게 매우 중요하다.',
  '◈ 자기의 미래와 꿈을 거침없이 이야기하는 사람들이 부럽다.',
  '◈ 말하지 못할 나만의 열등감이 많다.',
  '◈ 잘하는 척 하기 위해 거짓말을 한 적이 종종있다.',
  '◈ 솔직히 열등의식은 나를 움직이는 힘이다.',
  '◈ 미래에 지금보다 더 못해질까 걱정이 된다.',
  '◈ 내가 가지지 못한 것을 가진 사람들을 보면 주눅이 들거나 화가 난다.',
  '◈ 나는 그다지 건강하지 않다고 생각한다.',
  '◈ 어렸을 때 몸이 아팠던 기억들이 많다.',
  '◈ 영양제나 음식, 운동 등 건강에 신경을 많이 쓴다.',
  '◈ 앞으로 더 나이들어 병에 걸리면 어쩌나 걱정이 된다.',
  '◈ 주변이나 티비에서 몸이 아픈 사람을 보면 나도 그럴까 걱정이 된다.',
  '◈ 싫은 사람을 생각해보면 머릿속에 많이 떠오른다.',
  '◈ 어렸을 때 따돌림이나 구박을 받은 기억이 많다.',
  '◈ 마음에 안 드는 사람과 마주치기 싫어 신경쓰며 산다.',
  '◈ 원수 같이 싫은 사람을 앞으로 또 만나면 어쩌나 걱정된다.',
  '◈ 인간관계에 대해 해탈한 사람들을 보면 솔직히 거짓말이라 생각한다.',
  '◈ 나는 스트레스가 많다.',
  '◈ 사는 것이 전반적으로 힘들다.',
];

/* 카테고리 정의: 문항 index 범위 (0-based) */
const CATS = ['돈','사랑','명예','자존심','가족','미래','열등감','건강','인간관계'];
// Q1-5 → idx 0-4, Q6-10 → 5-9, ..., Q41-45 → 40-44  / 스트레스 Q46-47 → 45-46
const CAT_RANGE = { // [start, end) 0-based
  '돈':      [0,  5],
  '사랑':    [5,  10],
  '명예':    [10, 15],
  '자존심':  [15, 20],
  '가족':    [20, 25],
  '미래':    [25, 30],
  '열등감':  [30, 35],
  '건강':    [35, 40],
  '인간관계':[40, 45],
};
const STRESS_RANGE = [45, 47]; // 스트레스 Q46-47

/* 카테고리 색상 */
const CAT_COLOR = {
  '돈':      '#4f5fcf',
  '사랑':    '#ec4899',
  '명예':    '#a855f7',
  '자존심':  '#f97316',
  '가족':    '#22c55e',
  '미래':    '#3b82f6',
  '열등감':  '#ef4444',
  '건강':    '#14b8a6',
  '인간관계':'#eab308',
};

/* ══ 종합 멘트 (기존, 4구간) ══ */
const OVERALL_COMMENTS = [
  { min: 0,  text: '놀라워요! 마음이 깨끗하고 잔잔하여 스트레스를 쉽게 받지 않으시겠군요. 이미 맑은 나의 마음. 빼기 명상으로 항상 투명해지자고요!' },
  { min: 30, text: '전반적으로 마음 쓰는 곳이 적어 스트레스를 많이 받지 않으시겠군요. 명상이 잘 되시겠어요. 빼기 명상으로 언제나 맑은 마음이 금방 되실겁니다!' },
  { min: 45, text: '마음 쓰이는 곳이 다소 있어 스트레스를 받을 수 있지만 문제없어요. 오히려 명상의 효과가 잘 느껴지실 겁니다. 오늘 그 마음을 빼보도록 해요!' },
  { min: 60, text: '전반적으로 마음 쓰이는 곳이 많아 스트레스를 쉽게 받으실 수 있겠어요. 빼기 명상이 큰 도움이 될 겁니다. 빠르게 좋아지는 것이 느껴지실 거예요.' },
];

/* ══ 카테고리별 멘트 (신규, 9×4 구간) ══
   구간 기준: catNorm×100 (0~100)
   낮음[0,25) / 보통[25,50) / 높음[50,75) / 매우높음[75,100]
*/
const CAT_COMMENTS = {
  '돈': [
    { min: 0,  band: '낮음',    text: '돈에 대한 마음이 비교적 가볍군요. 경제적인 걱정보다 삶의 다른 풍요로움을 잘 누리고 계신 것 같아 다행이에요.' },
    { min: 25, band: '보통',    text: '돈에 어느 정도 마음이 쓰이고 있군요. 경제적인 부분이 가끔 마음 한켠을 차지하고 있을 수 있어요. 돈에 대한 마음을 한 번 가볍게 들여다볼 시간을 가져봅시다.' },
    { min: 50, band: '높음',    text: '돈에 마음이 많이 가 있지는 않나요? 돈을 벌고 쓰는 것, 돈에 대한 과거나 미래, 걱정 및 계획 등 돈에 쓰이는 마음을 명상을 통해 정리해봅시다.' },
    { min: 75, band: '매우높음', text: '돈에 대한 마음이 꽤 강하게 자리 잡고 있는 것 같아요. 경제적인 불안이나 걱정이 일상 속에서 크게 느껴지고 있지는 않은가요? 빼기 명상으로 그 무거운 마음을 조금씩 덜어내 봅시다.' },
  ],
  '사랑': [
    { min: 0,  band: '낮음',    text: '사랑에 대한 마음이 지금은 비교적 고요한 상태네요. 받고 싶고 주고 싶은 마음이 지금은 잔잔하게 흐르고 있는 것 같아요.' },
    { min: 25, band: '보통',    text: '사랑받고 싶은 마음이 어느 정도 있군요. 사람들과의 관계에서 따뜻함을 기대하는 마음, 자연스러운 것이에요. 그 마음을 한 번 들여다봐요.' },
    { min: 50, band: '높음',    text: '사랑 받는 것, 사랑 하는 것, 사랑에 대한 아픈 기억과 좋았던 기억 등 사랑이라는 것에 나의 마음이 많이 가 있군요. 명상으로 그 마음을 살펴봅시다.' },
    { min: 75, band: '매우높음', text: '사랑에 대한 갈망이나 상처가 마음 깊이 자리하고 있는 것 같아요. 충분히 사랑받고 싶은 마음, 그리고 사랑받지 못했던 기억들이 지금도 마음을 흔들고 있지는 않나요? 빼기 명상으로 그 마음을 부드럽게 다독여봅시다.' },
  ],
  '명예': [
    { min: 0,  band: '낮음',    text: '명예나 인정에 대한 마음이 현재는 가벼운 편이에요. 남의 시선보다 나 자신의 기준으로 살아가고 계신 것 같아 멋져요.' },
    { min: 25, band: '보통',    text: '이름을 알리거나 인정받고 싶은 마음이 어느 정도 있군요. 사람이라면 누구나 가질 수 있는 자연스러운 욕구예요. 그 마음이 나를 얼마나 움직이는지 한 번 살펴봐요.' },
    { min: 50, band: '높음',    text: '이름을 알리거나 사회적인 위치를 가지는 것, 성공에 대해 마음이 많이 쓰이시나요? 명예에 쓰이는 나의 마음을 명상을 통해 한 번 생각해봅시다.' },
    { min: 75, band: '매우높음', text: '명예와 인정에 대한 마음이 꽤 크게 자리하고 있어요. 남들에게 인정받고 싶고, 알려지고 싶은 마음이 일상의 많은 부분을 차지하고 있지는 않나요? 빼기 명상으로 그 마음을 조금 내려놓아봅시다.' },
  ],
  '자존심': [
    { min: 0,  band: '낮음',    text: '자존심에 대한 마음이 지금은 고요한 편이에요. 남과의 비교에서 비교적 자유롭고, 자신을 그대로 받아들이고 있는 것 같아요.' },
    { min: 25, band: '보통',    text: '자존심이 마음 한켠에 자리하고 있군요. 가끔 상처를 받거나 자존감이 흔들릴 때가 있을 수 있어요. 그 마음을 가볍게 들여다볼 시간을 가져봐요.' },
    { min: 50, band: '높음',    text: '남에게 지기 싫어하고 굽히지 않는 자존심에 내 마음이 가있을지도 모르겠어요. 자존심을 한 번 다시 생각하며 평화로운 마음이 될 수 있도록 명상을 통해 살펴봅시다.' },
    { min: 75, band: '매우높음', text: '자존심이나 자존감 문제가 마음속에서 꽤 크게 작동하고 있는 것 같아요. 상처받지 않으려는 방어, 인정받고 싶은 마음이 에너지를 많이 소모하고 있지 않나요? 빼기 명상으로 그 마음의 짐을 조금 덜어봅시다.' },
  ],
  '가족': [
    { min: 0,  band: '낮음',    text: '가족에 대한 마음이 현재는 비교적 편안한 상태예요. 가족 관계에서 큰 걱정이나 짐이 없이 지내고 계신 것 같아 다행이에요.' },
    { min: 25, band: '보통',    text: '가족에 대한 마음이 어느 정도 있군요. 가족이 소중하게 느껴지면서도 때로 부담이나 걱정이 되기도 하지 않나요? 그 마음을 한 번 들여다봐요.' },
    { min: 50, band: '높음',    text: '가족에 마음을 쓰고 계실 수 있겠어요. 가족에 대한 사랑, 걱정, 애증 등 내 마음 속에 많은 부분을 차지하는 가족을 명상을 통해 숙고해봅시다.' },
    { min: 75, band: '매우높음', text: '가족이 마음의 아주 큰 부분을 차지하고 있어요. 사랑과 걱정, 혹은 해결되지 않은 감정들이 함께 쌓여 있을 수 있어요. 빼기 명상으로 그 복잡한 마음을 부드럽게 정리해봅시다.' },
  ],
  '미래': [
    { min: 0,  band: '낮음',    text: '미래에 대한 마음이 지금은 가벼운 편이에요. 불필요한 걱정 없이 현재에 집중하며 살아가고 계신 것 같아요.' },
    { min: 25, band: '보통',    text: '미래에 대한 계획이나 꿈이 어느 정도 마음에 자리하고 있군요. 앞날에 대한 기대와 걱정이 가끔 마음을 흔들 수 있어요. 한 번 그 마음을 살펴봐요.' },
    { min: 50, band: '높음',    text: '무언가 하고 싶은 것에 내 마음이 가있지는 않나요? 소망과 욕구 등 미래에 대한 기대와 걱정을 명상을 통해 정리하며 마음을 가볍게 만들어봅시다.' },
    { min: 75, band: '매우높음', text: '미래에 대한 걱정이나 집착이 꽤 강하게 작동하고 있어요. 계획대로 되어야 한다는 압박, 꿈을 이뤄야 한다는 의무감이 마음을 무겁게 만들고 있지는 않나요? 빼기 명상으로 그 마음의 무게를 덜어봅시다.' },
  ],
  '열등감': [
    { min: 0,  band: '낮음',    text: '열등감이 지금은 비교적 고요하게 가라앉아 있는 것 같아요. 자신을 있는 그대로 바라보며 잘 살고 계신 것 같아요.' },
    { min: 25, band: '보통',    text: '열등감이 가끔 고개를 드는 것 같군요. 다른 사람과 비교하면서 스스로 작아지는 순간이 있을 수 있어요. 그 마음을 조용히 들여다봐요.' },
    { min: 50, band: '높음',    text: '열등감이 나를 감싸고 있지는 않나요? 나도 모르게 다른 사람과 비교하며 나를 낮추고 있을지 모르는 그 마음을 명상을 통해 정리해봅시다.' },
    { min: 75, band: '매우높음', text: '열등감이 마음속 깊이 자리하며 많은 영향을 미치고 있는 것 같아요. 비교하고, 부족하다고 느끼고, 감추려는 마음이 에너지를 많이 소모하지 않나요? 빼기 명상으로 그 마음을 조금씩 걷어내봅시다.' },
  ],
  '건강': [
    { min: 0,  band: '낮음',    text: '건강에 대한 마음이 현재는 가벼운 편이에요. 몸에 대한 걱정보다 삶의 활력을 잘 느끼며 지내고 계신 것 같아 좋아요.' },
    { min: 25, band: '보통',    text: '건강에 대한 관심이나 걱정이 어느 정도 있군요. 내 몸을 잘 돌보려는 마음, 좋은 것이지만 가끔 불안이 따라오지는 않나요? 한 번 살펴봐요.' },
    { min: 50, band: '높음',    text: '내 마음은 몸에 가 있을지도 모르겠어요. 지금 아프거나 예전에 아팠던 기억, 혹은 앞으로의 건강 걱정을 명상을 통해 깨끗하게 만들어봅시다.' },
    { min: 75, band: '매우높음', text: '건강에 대한 걱정이 마음 많은 부분을 차지하고 있는 것 같아요. 아픈 기억이나 미래에 대한 두려움이 일상에서 크게 느껴지고 있지는 않나요? 빼기 명상으로 그 불안한 마음을 부드럽게 내려놓아봅시다.' },
  ],
  '인간관계': [
    { min: 0,  band: '낮음',    text: '인간관계에 대한 마음이 지금은 비교적 자유로운 상태예요. 사람들에 대한 거리낌 없이 편안하게 지내고 계신 것 같아요.' },
    { min: 25, band: '보통',    text: '인간관계에서 어느 정도 마음이 쓰이고 있군요. 싫은 사람이 생각나거나, 관계에서 피하고 싶은 상황이 가끔 있을 수 있어요. 그 마음을 들여다봐요.' },
    { min: 50, band: '높음',    text: '마음에 지워지지 않는 사람이 있나요? 밉거나 나를 힘들게 했던 사람에 대한 기억을 명상을 통해 걷어내면 잔잔하고 맑은 마음이 될 거예요.' },
    { min: 75, band: '매우높음', text: '인간관계에서 받은 상처나 불편함이 마음속에 깊이 쌓여 있는 것 같아요. 특정 사람에 대한 감정이나 과거 상처가 지금도 영향을 미치고 있지 않나요? 빼기 명상으로 그 마음의 짐을 조금 내려놓아봅시다.' },
  ],
};

/* ══ 점수 계산 ══ */
function calcScores(answers) {
  const catSums = {};
  CATS.forEach(c => catSums[c] = 0);
  let stressSum = 0;

  CATS.forEach(cat => {
    const [s, e] = CAT_RANGE[cat];
    for (let i = s; i < e; i++) catSums[cat] += (answers[i] || 0);
  });

  const [ss, se] = STRESS_RANGE;
  for (let i = ss; i < se; i++) stressSum += (answers[i] || 0);

  // catNorm = (sum - 5) / 20, clamped [0,1]
  const catNorm = {};
  CATS.forEach(c => {
    catNorm[c] = Math.max(0, Math.min(1, (catSums[c] - 5) / 20));
  });

  // stressNorm = (sum - 2) / 8
  const stressNorm = Math.max(0, Math.min(1, (stressSum - 2) / 8));

  // maxNorm
  const maxNorm = Math.max(...CATS.map(c => catNorm[c]));

  // weighted = catNorm * avg(stressNorm, maxNorm)
  const weighted = {};
  const avgFactor = (stressNorm + maxNorm) / 2;
  CATS.forEach(c => { weighted[c] = catNorm[c] * avgFactor; });

  return { catNorm, stressNorm, weighted, catSums, stressSum };
}

function rankCategories(catNorm) {
  return [...CATS].sort((a, b) => {
    const diff = catNorm[b] - catNorm[a];
    if (Math.abs(diff) > 1e-9) return diff;
    return CATS.indexOf(a) - CATS.indexOf(b); // tie-break: category order
  });
}

function calcStressIndex(ranked, weighted) {
  const top3 = ranked.slice(0, 3);
  const avg = top3.reduce((s, c) => s + weighted[c], 0) / 3;
  return Math.round(avg * 100 * 100) / 100; // round to 2dp
}

function lookupOverallComment(index) {
  let comment = OVERALL_COMMENTS[0].text;
  for (const c of OVERALL_COMMENTS) {
    if (index >= c.min) comment = c.text;
  }
  return comment;
}

function lookupCategoryComment(cat, catScore100) {
  const bands = CAT_COMMENTS[cat];
  let entry = bands[0];
  for (const b of bands) {
    if (catScore100 >= b.min) entry = b;
  }
  return entry;
}

/* ══ 상태 ══ */
const state = {
  answers: {},    // { 0: 1..5, ... }
  currentPage: 0,
  scores: null,
};

const QUESTIONS_PER_PAGE = 10;

/* ══ 화면 전환 ══ */
const screens = {
  intro:  document.getElementById('screen-intro'),
  survey: document.getElementById('screen-survey'),
  result: document.getElementById('screen-result'),
};

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  window.scrollTo(0, 0);
}

/* ══ 인트로 ══ */
document.getElementById('btn-start').addEventListener('click', () => {
  renderPage(0);
  showScreen('survey');
  updateProgress();
});

/* ══ 설문 렌더 ══ */
function renderPage(pageIdx) {
  state.currentPage = pageIdx;
  const listEl = document.getElementById('question-list');
  listEl.innerHTML = '';

  const start = pageIdx * QUESTIONS_PER_PAGE;
  const end = Math.min(start + QUESTIONS_PER_PAGE, QUESTIONS.length);

  for (let i = start; i < end; i++) {
    const item = document.createElement('div');
    item.className = 'question-item';
    item.id = `q-item-${i}`;

    const currentAns = state.answers[i];
    if (currentAns !== undefined) {
      item.classList.add('answered');
    } else if (i === getFirstUnansweredOnPage(pageIdx)) {
      item.classList.add('focused');
    }

    item.innerHTML = `
      <div class="q-meta"><span class="q-number">Q${i + 1}</span></div>
      <p class="q-text">${QUESTIONS[i]}</p>
      <div class="q-linear-scale" id="scale-${i}">
        ${[1,2,3,4,5].map(val => `
          <div class="scale-option ${currentAns === val ? 'selected' : ''}" data-val="${val}" data-idx="${i}">
            <div class="scale-circle"></div>
            <div class="${val === 1 ? 'scale-label-end' : val === 5 ? 'scale-label-end' : 'scale-label'}">${
              val === 1 ? '별로<br>그렇지 않다<br>(1)' :
              val === 5 ? '매우<br>그러하다<br>(5)' :
              val
            }</div>
          </div>
        `).join('')}
      </div>
    `;
    listEl.appendChild(item);
  }

  listEl.querySelectorAll('.scale-option').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx, 10);
      const val = parseInt(el.dataset.val, 10);
      state.answers[idx] = val;

      const scaleEl = document.getElementById(`scale-${idx}`);
      scaleEl.querySelectorAll('.scale-option').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');

      const itemEl = document.getElementById(`q-item-${idx}`);
      itemEl.classList.add('answered');
      itemEl.classList.remove('focused');
      updateProgress();

      // auto-scroll to next unanswered
      const nextIdx = idx + 1;
      if (nextIdx < end && state.answers[nextIdx] === undefined) {
        const nextEl = document.getElementById(`q-item-${nextIdx}`);
        nextEl.classList.add('focused');
        const wh = window.innerHeight;
        const rect = nextEl.getBoundingClientRect();
        window.scrollTo({ top: rect.top + window.pageYOffset - wh / 2 + rect.height / 2, behavior: 'smooth' });
      }

      updateNavButtons();
    });
  });

  updateNavButtons();
  listEl.classList.remove('slide-in');
  void listEl.offsetWidth;
  listEl.classList.add('slide-in');
}

function getFirstUnansweredOnPage(pageIdx) {
  const start = pageIdx * QUESTIONS_PER_PAGE;
  const end = Math.min(start + QUESTIONS_PER_PAGE, QUESTIONS.length);
  for (let i = start; i < end; i++) {
    if (state.answers[i] === undefined) return i;
  }
  return -1;
}

function scrollToQuestion(qIdx) {
  const el = document.getElementById(`q-item-${qIdx}`);
  if (!el) return;
  el.classList.add('focused');
  const wh = window.innerHeight;
  const rect = el.getBoundingClientRect();
  window.scrollTo({ top: rect.top + window.pageYOffset - wh / 2 + rect.height / 2, behavior: 'smooth' });
}

function updateProgress() {
  const answered = Object.keys(state.answers).length;
  document.getElementById('progress-bar').style.width = (answered / QUESTIONS.length * 100) + '%';
  document.getElementById('progress-text').textContent = `${answered}/${QUESTIONS.length} 완료`;
}

function updateNavButtons() {
  const start = state.currentPage * QUESTIONS_PER_PAGE;
  const end = Math.min(start + QUESTIONS_PER_PAGE, QUESTIONS.length);
  const isLast = end >= QUESTIONS.length;
  document.getElementById('btn-prev').disabled = state.currentPage === 0;
  document.getElementById('btn-next').textContent = isLast ? '결과 보기 →' : '다음 →';
  document.getElementById('btn-next').disabled = false;
}

document.getElementById('btn-prev').addEventListener('click', () => {
  if (state.currentPage > 0) {
    renderPage(state.currentPage - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

document.getElementById('btn-next').addEventListener('click', () => {
  const start = state.currentPage * QUESTIONS_PER_PAGE;
  const end = Math.min(start + QUESTIONS_PER_PAGE, QUESTIONS.length);
  const isLast = end >= QUESTIONS.length;

  if (!isLast) {
    const first = getFirstUnansweredOnPage(state.currentPage);
    if (first >= 0) { scrollToQuestion(first); return; }
    renderPage(state.currentPage + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // last page: check all unanswered
  const unanswered = [];
  for (let i = 0; i < QUESTIONS.length; i++) {
    if (state.answers[i] === undefined) unanswered.push(i);
  }
  if (unanswered.length > 0) {
    const nums = unanswered.map(i => i + 1).join(', ');
    alert(`아직 응답하지 않은 문항이 ${unanswered.length}개 있습니다.\n(${nums}번 문항)\n해당 문항으로 이동합니다.`);
    renderPage(Math.floor(unanswered[0] / QUESTIONS_PER_PAGE));
    scrollToQuestion(unanswered[0]);
    return;
  }

  if (!confirm('모든 문항에 응답하셨습니다.\n결과를 확인하시겠습니까?')) return;

  const scores = calcScores(state.answers);
  state.scores = scores;
  renderReport(scores);
  showScreen('result');
});

/* ══ 레포트 렌더 ══ */
function renderReport(scores) {
  const { catNorm, weighted } = scores;
  const ranked = rankCategories(catNorm);
  const stressIdx = calcStressIndex(ranked, weighted);
  const overallComment = lookupOverallComment(stressIdx);

  // ① 스트레스 지수
  document.getElementById('rpt-stress-num').textContent = stressIdx.toFixed(1);
  // gauge needle: 0→0%, 100→100%
  const needlePct = Math.min(100, Math.max(0, stressIdx));
  document.getElementById('rpt-gauge-needle').style.left = needlePct + '%';
  document.getElementById('rpt-overall-comment').textContent = overallComment;

  // ② 순위 막대
  renderRankBars(ranked, weighted);

  // ③ 머릿속
  renderHeadViz(ranked, catNorm);

  // ④ Top3 카드
  renderTop3Cards(ranked, catNorm);
}

function renderRankBars(ranked, weighted) {
  const el = document.getElementById('rpt-rank-bars');
  el.innerHTML = '';
  const maxW = Math.max(...CATS.map(c => weighted[c]));

  ranked.forEach((cat, i) => {
    const score = Math.round(weighted[cat] * 100 * 10) / 10;
    const barPct = maxW > 0 ? (weighted[cat] / maxW) * 100 : 0;
    const color = CAT_COLOR[cat];
    const row = document.createElement('div');
    row.className = 'rank-bar-row';
    row.innerHTML = `
      <span class="rank-bar-rank">${i + 1}</span>
      <span class="rank-bar-label">${cat}</span>
      <div class="rank-bar-track">
        <div class="rank-bar-fill" style="width:${barPct}%;background:${color}"></div>
      </div>
      <span class="rank-bar-score" style="color:${color}">${score}</span>
    `;
    el.appendChild(row);
  });
}

/* 머리 그림 내부 두뇌 영역의 상위 5개 슬롯 좌표 (머리 이미지 기준 %)
   이미지 740×759. 두뇌 영역은 대략 x:18%~75%, y:5%~52%.
   5개 슬롯을 등분하여 글자가 겹치지 않게 배치. */
const HEAD_SLOTS = [
  { x: 35, y: 16, size: 1.4 },  // 1위 - 상단 중앙
  { x: 55, y: 28, size: 1.2 },  // 2위 - 우측 중간
  { x: 25, y: 34, size: 1.0 },  // 3위 - 좌측 중간
  { x: 50, y: 43, size: 0.85 }, // 4위 - 하단 우
  { x: 30, y: 46, size: 0.75 }, // 5위 - 하단 좌
];

function renderHeadViz(ranked, catNorm) {
  const wrap = document.getElementById('rpt-head-wrap');
  // remove old labels
  wrap.querySelectorAll('.head-label').forEach(l => l.remove());

  const img = wrap.querySelector('img');
  const iw = img.offsetWidth || 300;
  const ih = img.offsetHeight || iw * (759 / 740);

  ranked.slice(0, 5).forEach((cat, i) => {
    if (catNorm[cat] < 0.01) return; // skip zero-score
    const slot = HEAD_SLOTS[i];
    const label = document.createElement('div');
    label.className = 'head-label';
    const fontSize = Math.round(12 * slot.size);
    label.style.cssText = `
      left: ${slot.x}%;
      top: ${slot.y}%;
      font-size: ${fontSize}px;
      color: ${CAT_COLOR[cat]};
      transform: translateX(-50%);
    `;
    label.textContent = cat;
    wrap.appendChild(label);
  });
}

// Re-render head labels after image load / resize
window.addEventListener('resize', () => {
  if (state.scores) {
    const { catNorm, weighted } = state.scores;
    const ranked = rankCategories(catNorm);
    renderHeadViz(ranked, catNorm);
  }
});
document.getElementById('rpt-head-img').addEventListener('load', () => {
  if (state.scores) {
    const { catNorm, weighted } = state.scores;
    const ranked = rankCategories(catNorm);
    renderHeadViz(ranked, catNorm);
  }
});

function renderTop3Cards(ranked, catNorm) {
  const el = document.getElementById('rpt-top3-cards');
  el.innerHTML = '';
  ranked.slice(0, 3).forEach((cat, i) => {
    const catScore100 = Math.round(catNorm[cat] * 100);
    const { band, text } = lookupCategoryComment(cat, catScore100);
    const color = CAT_COLOR[cat];
    const card = document.createElement('div');
    card.className = 'top3-card';
    card.innerHTML = `
      <div class="top3-rank-badge" style="background:${color}">${i + 1}</div>
      <div class="top3-card-body">
        <div class="top3-cat-name">${cat}</div>
        <span class="top3-band-tag" style="background:${color}18;color:${color}">${band} (${catScore100}점)</span>
        <p class="top3-comment">${text}</p>
      </div>
    `;
    el.appendChild(card);
  });
}

/* ══ PDF 저장 ══ */
document.getElementById('btn-pdf').addEventListener('click', async () => {
  const btn = document.getElementById('btn-pdf');
  btn.disabled = true; btn.textContent = '생성 중...';
  try {
    document.body.classList.add('pdf-capture');
    void document.body.offsetHeight;
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const A4W = 210, A4H = 297;
    const pages = document.querySelectorAll('.pdf-page');
    for (let i = 0; i < pages.length; i++) {
      const canvas = await html2canvas(pages[i], { scale: 2, useCORS: true, backgroundColor: '#fdfcf9' });
      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const ratio = canvas.height / canvas.width;
      const imgW = A4W, imgH = imgW * ratio;
      if (i > 0) pdf.addPage();
      if (imgH <= A4H) pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
      else pdf.addImage(imgData, 'JPEG', 0, 0, imgW * (A4H / imgH), A4H);
    }
    pdf.save('내마음알아보기_결과.pdf');
  } catch(e) {
    alert('PDF 생성 중 오류가 발생했습니다.');
  } finally {
    document.body.classList.remove('pdf-capture');
    btn.disabled = false; btn.textContent = 'PDF 저장';
  }
});

/* ══ 다시하기 ══ */
document.getElementById('btn-restart').addEventListener('click', () => {
  state.answers = {};
  state.scores = null;
  state.currentPage = 0;
  showScreen('intro');
});

/* ══ 시작 ══ */
showScreen('intro');
