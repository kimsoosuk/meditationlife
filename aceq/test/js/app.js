import { QUESTIONS, aggregateScores, toMentalIndex, getLevel, getScoreColor, CATEGORIES, REPORT_CAT_ORDER } from '/aceq/test/js/questions.js';
import { api } from '/aceq/test/js/api.js';
import { mockDb } from '/assets/js/mockDb.js';

const state = { step: 'survey', currentPage: 0, answers: {}, userInfo: {}, resultId: null, scores: null, totalIndex: null, studentId: null };

const API_PARTIAL = window.APP_CONFIG?.apiBase || 'https://studymental.kimsoosuk1.workers.dev';

function savePartialToServer() {
  if (!state.studentId) return;
  fetch(`${API_PARTIAL}/api/partial`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studentId: state.studentId, answers: state.answers }),
  }).catch(() => {});
}

function clearPartialFromServer() {
  if (!state.studentId) return;
  fetch(`${API_PARTIAL}/api/partial?studentId=${encodeURIComponent(state.studentId)}`, {
    method: 'DELETE',
  }).catch(() => {});
}


const screens = {
  survey: document.getElementById('screen-survey'),
  result: document.getElementById('screen-result'),
  done: document.getElementById('screen-done'),
};


function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
  state.step = name;
  window.scrollTo(0, 0);
}

// ─── INFO 초기화 (마이페이지 학생 데이터에서 직접 로드) ────────────────────

// 마이페이지 학생 데이터에서 userInfo 로드 후 바로 설문 시작 (파일 맨 끝에서 호출)
async function initFromAccount() {
  // 레포트 조회(?result=) 컨텍스트에서는 설문 초기화를 건너뜀 (URL 결과 로더가 처리)
  if (new URLSearchParams(location.search).get('result')) return;
  try {
    const db = JSON.parse(localStorage.getItem('msat_mock_db') || 'null');
    const sess = JSON.parse(localStorage.getItem('msat_mock_session') || 'null');
    if (db && sess && Array.isArray(db.students)) {
      const urlStudentId = new URLSearchParams(location.search).get('student_id');
      let child = null;
      if (urlStudentId) child = db.students.find(s => s.id === urlStudentId);
      if (!child && sess.role === 'parent') child = db.students.find(s => s.parentUserId === sess.id);
      if (!child && sess.role === 'student') child = db.students.find(s => s.userId === sess.id);

      if (child && child.name) {
        const GRADE_MAP = { elem5: '초5', elem6: '초6', mid1: '중1', mid2: '중2', mid3: '중3', 'mid3+': '중3', high1: '고등학생 이상', high2: '고등학생 이상', high3: '고등학생 이상', grad: '고등학생 이상' };
        const POINTS = ['초5-1', '초5-2', '초6-1', '초6-2', '중1-1', '중1-2', '중2-1', '중2-2', '중3-1', '중3-2', '고1-1', '고1-2', '고2-1', '고2-2', '고3-1', '고3-2'];
        const GRADE_BASE = { elem5: 0, elem6: 2, mid1: 4, mid2: 6, mid3: 8, 'mid3+': 8 };
        const toAdvanceLabel = (point) => {
          const idx = POINTS.indexOf(point);
          const base = GRADE_BASE[child.grade];
          if (idx < 0 || base === undefined) return '없음';
          const months = (idx - base) * 6;
          if (months <= 0) return '없음';
          if (months < 6) return '6개월 미만';
          if (months <= 12) return '6개월~1년';
          if (months <= 24) return '1~2년';
          if (months <= 36) return '2~3년';
          return '3년 이상';
        };
        const subjects = [];
        const p = child.progress;
        if (p) {
          const SUBJ_KEYS = { '국어': 'korean', '영어': 'english', '수학': 'math' };
          for (const [subjName, key] of Object.entries(SUBJ_KEYS)) {
            if (p[key]) subjects.push({ subject: subjName, advance: toAdvanceLabel(p[key]) });
          }
        }
        state.userInfo = {
          name: child.name,
          grade: GRADE_MAP[child.grade] || child.grade || '',
          academies: subjects.length > 0 ? subjects.length + '개' : '없음',
          subjects,
        };
        state.studentId = child.id;
        try { mockDb.consumeAssignmentOnStart(child.id, 'ACEQ'); } catch (_) {}

        // 임시 저장 복원 시도
        try {
          const res = await fetch(`${API_PARTIAL}/api/partial?studentId=${encodeURIComponent(child.id)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.answers && typeof data.answers === 'object' && Object.keys(data.answers).length > 0) {
              state.answers = data.answers;
              // 첫 미응답 문항이 속한 페이지로 복원 (모두 응답 시 마지막 페이지)
              const lastPage = Math.ceil(QUESTIONS.length / QUESTIONS_PER_PAGE) - 1;
              let firstUnanswered = QUESTIONS.findIndex(q => state.answers[q.id] === undefined);
              const resumePage = firstUnanswered < 0
                ? lastPage
                : Math.min(Math.floor(firstUnanswered / QUESTIONS_PER_PAGE), lastPage);
              renderPage(resumePage);
              showScreen('survey');
              updateProgress();
              return;
            }
          }
        } catch (_) {}
      }
    }
  } catch (_) {}
  renderPage(0);
  showScreen('survey');
  updateProgress();
}

// ─── SURVEY ───────────────────────────────────────────────
const QUESTIONS_PER_PAGE = 10;
const SCALE = [
  { label: '매우 아니다', val: 4 },
  { label: '아니다', val: 3 },
  { label: '보통이다', val: 2 },
  { label: '그렇다', val: 1 },
  { label: '매우 그렇다', val: 0 }
];

function renderPage(pageIdx) {
  state.currentPage = pageIdx;
  const listEl = document.getElementById('question-list');
  listEl.innerHTML = '';

  const start = pageIdx * QUESTIONS_PER_PAGE;
  const end = Math.min(start + QUESTIONS_PER_PAGE, QUESTIONS.length);

  for (let i = start; i < end; i++) {
    const q = QUESTIONS[i];
    const item = document.createElement('div');
    item.className = 'question-item';
    item.id = `q-item-${i}`;

    const currentAns = state.answers[q.id];
    if (currentAns !== undefined) {
      item.classList.add('answered');
    } else if (i === getFirstUnansweredIndexOnPage(pageIdx)) {
      item.classList.add('focused');
    }

    item.innerHTML = `
      <div class="q-meta"><span class="q-number">${i + 1}</span></div>
      <p class="q-text">${q.text}</p>
      <div class="q-linear-scale" id="scale-${q.id}">
        ${SCALE.map(opt => `
          <div class="scale-option ${currentAns === opt.val ? 'selected' : ''}" data-val="${opt.val}" data-qid="${q.id}">
            <div class="scale-circle"></div>
            <div class="scale-label">${opt.label}</div>
          </div>
        `).join('')}
      </div>
    `;
    listEl.appendChild(item);
  }

  // Bind events
  listEl.querySelectorAll('.scale-option').forEach(el => {
    el.addEventListener('click', () => {
      const qid = parseInt(el.dataset.qid, 10);
      const val = parseInt(el.dataset.val, 10);
      state.answers[qid] = val;

      const scaleEl = document.getElementById(`scale-${qid}`);
      scaleEl.querySelectorAll('.scale-option').forEach(opt => opt.classList.remove('selected'));
      el.classList.add('selected');

      const qIndex = QUESTIONS.findIndex(q => q.id === qid);
      const itemEl = document.getElementById(`q-item-${qIndex}`);
      itemEl.classList.add('answered');
      itemEl.classList.remove('focused');

      updateProgress();

      const nextQIndex = qIndex + 1;
      if (nextQIndex < end) {
        const nextItem = document.getElementById(`q-item-${nextQIndex}`);
        if (state.answers[QUESTIONS[nextQIndex].id] === undefined) {
          nextItem.classList.remove('answered');
          nextItem.classList.add('focused');
          // Smooth scroll to next item so it's vertically centered
          const windowHeight = window.innerHeight;
          const rect = nextItem.getBoundingClientRect();
          const targetY = rect.top + window.pageYOffset - (windowHeight / 2) + (rect.height / 2);
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }
      }

      updateNavButtons();
    });
  });

  updateNavButtons();

  listEl.classList.remove('slide-in');
  void listEl.offsetWidth;
  listEl.classList.add('slide-in');
}

function getFirstUnansweredIndexOnPage(pageIdx) {
  const start = pageIdx * QUESTIONS_PER_PAGE;
  const end = Math.min(start + QUESTIONS_PER_PAGE, QUESTIONS.length);
  for (let i = start; i < end; i++) {
    if (state.answers[QUESTIONS[i].id] === undefined) return i;
  }
  return -1;
}

function updateNavButtons() {
  const start = state.currentPage * QUESTIONS_PER_PAGE;
  const end = Math.min(start + QUESTIONS_PER_PAGE, QUESTIONS.length);
  const isLastPage = end >= QUESTIONS.length;

  document.getElementById('btn-prev').disabled = state.currentPage === 0;
  const btnNext = document.getElementById('btn-next');
  btnNext.textContent = isLastPage ? '제출 →' : '다음 →';
  // 미응답이 있어도 클릭 가능 — 클릭 시 첫 미응답 문항으로 스크롤 안내
  btnNext.disabled = false;
}

// 특정 문항으로 스크롤 + 포커스 표시
function scrollToQuestion(qIndex) {
  const el = document.getElementById(`q-item-${qIndex}`);
  if (!el) return;
  el.classList.add('focused');
  const windowHeight = window.innerHeight;
  const rect = el.getBoundingClientRect();
  const targetY = rect.top + window.pageYOffset - (windowHeight / 2) + (rect.height / 2);
  window.scrollTo({ top: targetY, behavior: 'smooth' });
}

function updateProgress() {
  const answered = Object.keys(state.answers).length;
  document.getElementById('progress-bar').style.width = (answered / QUESTIONS.length * 100) + '%';
  document.getElementById('progress-text').textContent = `${answered}/${QUESTIONS.length} 완료`;
}

document.getElementById('btn-prev').addEventListener('click', () => {
  if (state.currentPage > 0) {
    renderPage(state.currentPage - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});
document.getElementById('btn-next').addEventListener('click', async () => {
  const isLastPage = (state.currentPage + 1) * QUESTIONS_PER_PAGE >= QUESTIONS.length;

  if (!isLastPage) {
    // 현재 페이지 미응답 검사 → 첫 미응답 문항으로 스크롤
    const firstUnanswered = getFirstUnansweredIndexOnPage(state.currentPage);
    if (firstUnanswered >= 0) {
      scrollToQuestion(firstUnanswered);
      return;
    }
    savePartialToServer();
    renderPage(state.currentPage + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  // 마지막 페이지: 전체 문항 미응답 검사 (네트워크 등으로 누락된 문항 확인)
  const unanswered = [];
  for (let i = 0; i < QUESTIONS.length; i++) {
    if (state.answers[QUESTIONS[i].id] === undefined) unanswered.push(i);
  }
  if (unanswered.length > 0) {
    const first = unanswered[0];
    const nums = unanswered.map(i => i + 1).join(', ');
    alert(`아직 응답하지 않은 문항이 ${unanswered.length}개 있습니다.\n(${nums}번 문항)\n해당 문항으로 이동합니다.`);
    renderPage(Math.floor(first / QUESTIONS_PER_PAGE));
    scrollToQuestion(first);
    return;
  }

  // 전체 응답 완료 → 제출 최종 확인
  if (!confirm('모든 문항에 응답하셨습니다.\n제출하시겠습니까? 제출 후에는 수정할 수 없습니다.')) return;

  const btn = document.getElementById('btn-next');
  btn.disabled = true;
  btn.textContent = '제출 중...';
  btn.style.opacity = '0.7';
  showSubmitOverlay();
  await submitSurvey();
});

function showSubmitOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'submit-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(247, 245, 240, 0.92);
    backdrop-filter: blur(8px);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 20px;
    animation: fadeIn 0.2s ease;
  `;
  overlay.innerHTML = `
    <div style="width: 52px; height: 52px; border: 4px solid #e2e2e2; border-top-color: #4f5fcf; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
    <p style="font-family: 'Noto Serif KR', serif; font-size: 1.1rem; font-weight: 600; color: #1a1a2e; margin: 0;">응답을 저장하고 있어요...</p>
    <p style="font-size: 0.85rem; color: #888; margin: 0;">잠시만 기다려주세요</p>
  `;
  document.body.appendChild(overlay);
}

// ─── SUBMIT ───────────────────────────────────────────────
async function submitSurvey() {
  // 방어적 재검증 — 누락 시 오버레이/버튼 복구 후 해당 문항으로 복귀
  const unanswered = QUESTIONS.filter(q => state.answers[q.id] === undefined);
  if (unanswered.length > 0) {
    const overlay = document.getElementById('submit-overlay');
    if (overlay) overlay.remove();
    const idx = QUESTIONS.findIndex(q => q.id === unanswered[0].id);
    alert(`아직 답하지 않은 문항이 ${unanswered.length}개 있습니다.\n${idx + 1}번 문항부터 확인해주세요.`);
    renderPage(Math.floor(idx / QUESTIONS_PER_PAGE));
    scrollToQuestion(idx);
    return;
  }

  const scores = aggregateScores(state.answers);
  const totalIndex = toMentalIndex(scores['전체']);
  state.scores = scores;
  state.totalIndex = totalIndex;

  const payload = { ...state.userInfo, answers: state.answers, scores, totalIndex };

  let resultId = state.studentId === 'student_chulsoo' ? 'mock_student_chulsoo' : 'mock_student_younghee';
  try {
    const res = await api.saveResult(payload);
    if (res && res.id) {
      resultId = res.id;
    }
  } catch (e) {
    console.warn('서버 저장 실패 (데모 fallback 모드로 전환):', e.message);
  }

  // 서버 저장 여부와 상관없이 로컬 DB에는 완료로 기록하여 테스트 흐름이 끊기지 않게 함
  mockDb.completeAssignment(state.studentId, 'ACEQ', `/aceq/test/?result=${resultId}`, '');
  state.resultId = resultId;

  // 제출 완료 후 임시 저장 삭제
  clearPartialFromServer();

  const overlay = document.getElementById('submit-overlay');
  if (overlay) overlay.remove();

  // 제출 완료 화면으로 이동 (AI 레포트는 관리자 페이지에서 생성)
  showScreen('done');
}

// ─── REPORT 렌더링 (즉시, 정적 데이터) ───────────────────
function renderReport(scores, totalIndex, info, createdAt) {
  const level = getLevel(totalIndex);

  // 헤더 (측정일)
  const dateStr = createdAt 
    ? new Date(createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  
  if (document.getElementById('rpt-name-title')) document.getElementById('rpt-name-title').textContent = info.name;
  if (document.getElementById('rpt-date')) document.getElementById('rpt-date').textContent = dateStr;

  if (document.getElementById('rpt-name')) document.getElementById('rpt-name').textContent = info.name;
  document.getElementById('rpt-grade').textContent = info.grade;
  document.getElementById('rpt-academies').textContent = info.academies;

  const subjectsText = info.subjects && info.subjects.length > 0
    ? info.subjects.map(s => `${s.subject}: ${s.advance}`).join(' / ')
    : '없음';
  document.getElementById('rpt-advance').innerHTML = subjectsText;
  // 페이지 2, 3, 4, 5 이름
  document.getElementById('rpt-name-2').textContent = info.name;
  document.getElementById('rpt-name-3').textContent = info.name;
  if (document.getElementById('rpt-name-4')) document.getElementById('rpt-name-4').textContent = info.name;
  if (document.getElementById('rpt-name-5')) document.getElementById('rpt-name-5').textContent = info.name;

  // 종합 지수
  document.getElementById('rpt-index').textContent = totalIndex;

  // 게이지 바늘 위치 (40~160 기준)
  const needlePct = Math.min(100, Math.max(0, ((totalIndex - 40) / 120) * 100));
  document.getElementById('rpt-needle').style.left = needlePct + '%';

  // 미니 바 차트
  renderMiniBars(scores);

  // 영역별 카테고리 (정적 — AI 텍스트는 나중에 삽입)
  renderCategoryCards(scores);
}

function renderMiniBars(scores) {
  const elInternal = document.getElementById('rpt-mini-bars-internal');
  const elExternal = document.getElementById('rpt-mini-bars-external');
  if (!elInternal || !elExternal) return;

  elInternal.innerHTML = '';
  elExternal.innerHTML = '';

  REPORT_CAT_ORDER.forEach(cat => {
    const pct = scores[cat] ?? 0;
    const idx = toMentalIndex(pct, cat);
    const color = getScoreColor(idx);
    const label = CATEGORIES[cat]?.label || cat;
    const barW = Math.min(100, Math.max(0, ((idx - 40) / 120) * 100));

    const html = `
      <div class="mini-bar-row">
        <span class="mini-bar-label">${label}</span>
        <div class="mini-bar-track">
          <div class="mini-bar-fill" style="width:${barW}%;background:${color}"></div>
        </div>
        <span class="mini-bar-score" style="color:${color}">${idx}</span>
      </div>`;

    if (['호감', '체감', '직감', '관리'].includes(cat)) {
      elInternal.innerHTML += html;
    } else {
      elExternal.innerHTML += html;
    }
  });
}

function renderCategoryCards(scores) {
  const el1 = document.getElementById('rpt-categories-1');
  const el2 = document.getElementById('rpt-categories-2');
  if (el1) el1.innerHTML = '';
  if (el2) el2.innerHTML = '';

  REPORT_CAT_ORDER.forEach((cat, index) => {
    const pct = scores[cat] ?? 0;
    const idx = toMentalIndex(pct, cat);
    const color = getScoreColor(idx);
    const label = CATEGORIES[cat]?.label || cat;
    const desc = CATEGORIES[cat]?.desc || '';
    const barW = Math.min(100, Math.max(0, ((idx - 40) / 120) * 100));
    const card = document.createElement('div');
    card.className = 'cat-card';
    card.dataset.cat = cat;
    card.innerHTML = `
      <div class="cat-card-header">
        <div class="cat-card-left">
          <span class="cat-card-dot" style="background:${color}"></span>
          <span class="cat-card-name">${label}</span>
          <span class="cat-card-desc">${desc}</span>
        </div>
        <span class="cat-card-index" style="color:${color}">${idx}</span>
      </div>
      <div class="cat-card-bar-track">
        <div class="cat-card-bar-fill" style="width:${barW}%;background:${color}15;border-right:3px solid ${color}"></div>
      </div>
      <div class="cat-card-analysis" id="cat-analysis-${cat.replace(/[()]/g, '_')}">
        <div class="ai-loading-sm">AI 분석 생성 중...</div>
      </div>`;

    // 호감, 체감, 직감, 종합은 1페이지(내적 요인), 나머지는 2페이지(외적 요인)
    const isInnerFactor = ['호감', '체감', '직감', '관리'].includes(cat);
    if (isInnerFactor && el1) {
      el1.appendChild(card);
    } else if (!isInnerFactor && el2) {
      el2.appendChild(card);
    }
  });
}

function renderAIReportToDOM(report) {
  // 총평
  const summaryEl = document.getElementById('rpt-summary');
  if (summaryEl) summaryEl.innerHTML = `<p>${report.summary}</p>`;

  // 카테고리별
  if (Array.isArray(report.categories)) {
    report.categories.forEach(item => {
      let catName = item.name;
      if (catName === '종합') catName = '관리'; // DB 호환성: 옛날 데이터는 '종합'으로 되어있음

      const key = catName.replace(/[()]/g, '_');
      const el = document.getElementById(`cat-analysis-${key}`);
      if (el) el.innerHTML = `<p>${item.analysis}</p>`;
    });
  }

  // 예측
  const prophecyEl = document.getElementById('rpt-prophecy');
  if (prophecyEl) {
    let firstH4 = true;
    const html = report.prophecy.split('\n').filter(p => p.trim()).map(p => {
      if (p.startsWith('###') || p.startsWith('**')) {
        const marginTop = firstH4 ? '0px' : '15px';
        firstH4 = false;
        return `<h4 style="margin-top:${marginTop}; margin-bottom:8px; font-weight:800; color:#fff;">${p.replace(/[#*]/g, '').trim()}</h4>`;
      }
      return `<p style="margin-bottom:10px;">${p}</p>`;
    }).join('');
    prophecyEl.innerHTML = html;
  }

  // 예측 그래프
  const graphEl = document.getElementById('rpt-prediction-graph');
  if (graphEl) {
    if (report.prediction_graph && report.prediction_graph.length > 0) {
      drawPredictionGraph(report.prediction_graph);
    } else {
      graphEl.innerHTML = '<p class="ai-loading-sm" style="color:var(--c-muted); padding:20px;">예측 데이터가 없습니다. 레포트를 재생성해 주세요.</p>';
    }
  }

  // 학원/선행 코멘트
  const academyAdviceEl = document.getElementById('rpt-academy-advice');
  if (academyAdviceEl && report.academy_advice) {
    let firstH4 = true;
    const html = report.academy_advice.split('\n').filter(p => p.trim()).map(p => {
      if (p.startsWith('###') || p.startsWith('**')) {
        const marginTop = firstH4 ? '0px' : '15px';
        firstH4 = false;
        return `<h4 style="margin-top:${marginTop}; margin-bottom:8px; font-weight:800; color:#000;">${p.replace(/[#*]/g, '').trim()}</h4>`;
      }
      return `<p style="margin-bottom:10px;">${p}</p>`;
    }).join('');
    academyAdviceEl.innerHTML = html;
  }

  // 핵심 조언
  const adviceEl = document.getElementById('rpt-advice');
  if (adviceEl) {
    const lines = report.advice.split('\n').filter(l => l.trim());
    adviceEl.innerHTML = lines.map(l => `<p style="margin-bottom:8px;">${l}</p>`).join('');
  }
}

function drawPredictionGraph(data) {
  const container = document.getElementById('rpt-prediction-graph');
  if (!container || !data || !data.length) return;
  container.innerHTML = '';

  const w = 700;
  const h = 208; // 260 * 0.8
  const padding = { t: 30, r: 60, b: 40, l: 60 };

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.style.width = '100%';
  svg.style.height = 'auto';

  // Dynamic Scale based on data
  const scores = data.map(d => d.score);
  const minVal = Math.min(...scores);
  const maxVal = Math.max(...scores);
  const yMin = minVal - 3;
  const yMax = maxVal + 3;
  const yRange = (yMax - yMin) || 6;

  const xStep = (w - padding.l - padding.r) / Math.max(1, data.length - 1);
  const yScale = (score) => h - padding.b - ((score - yMin) / yRange) * (h - padding.t - padding.b);

  // Gradient for the line
  const gradId = 'line-grad-' + Math.random().toString(36).substr(2, 9);
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  grad.setAttribute('id', gradId);
  grad.setAttribute('x1', '0%');
  grad.setAttribute('y1', '0%');
  grad.setAttribute('x2', '100%');
  grad.setAttribute('y2', '0%');

  data.forEach((d, i) => {
    const offset = (i / Math.max(1, data.length - 1)) * 100;
    const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop.setAttribute('offset', `${offset}%`);
    stop.setAttribute('stop-color', getScoreColor(d.score));
    grad.appendChild(stop);
  });
  defs.appendChild(grad);
  svg.appendChild(defs);

  // Line path
  let pathD = '';
  data.forEach((d, i) => {
    const x = padding.l + i * xStep;
    const y = yScale(d.score);
    pathD += (i === 0 ? 'M' : 'L') + `${x},${y}`;
  });

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', pathD);
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', `url(#${gradId})`);
  line.setAttribute('stroke-width', '4'); // 약간 더 두껍게
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(line);

  // Points and Labels
  data.forEach((d, i) => {
    const x = padding.l + i * xStep;
    const y = yScale(d.score);

    // Dot
    const pColor = getScoreColor(d.score);
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', y);
    circle.setAttribute('r', '6');
    circle.setAttribute('fill', '#fff');
    circle.setAttribute('stroke', pColor);
    circle.setAttribute('stroke-width', '2.5');
    svg.appendChild(circle);

    // Grade Label
    const gTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    gTxt.setAttribute('x', x);
    gTxt.setAttribute('y', h - padding.b + 25);
    gTxt.setAttribute('text-anchor', 'middle');
    gTxt.setAttribute('font-size', '12');
    gTxt.setAttribute('font-weight', '700');
    gTxt.setAttribute('fill', '#888');
    gTxt.textContent = d.grade;
    svg.appendChild(gTxt);

    // Score Label (현재 학년은 숫자, 이후는 화살표)
    const sTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    sTxt.setAttribute('x', x);
    sTxt.setAttribute('y', y - 15);
    sTxt.setAttribute('text-anchor', 'middle');
    sTxt.setAttribute('font-size', '14');
    sTxt.setAttribute('font-weight', '800');
    sTxt.setAttribute('fill', pColor);
    
    if (i === 0) {
      sTxt.textContent = Math.round(d.score);
    } else {
      const diff = d.score - data[i - 1].score;
      if (diff > 0.5) sTxt.textContent = '▲';
      else if (diff < -0.5) sTxt.textContent = '▼';
      else sTxt.textContent = '-';
      sTxt.setAttribute('font-size', '12'); // 화살표는 살짝 작게
    }
    svg.appendChild(sTxt);

    // Reason Label
    if (d.reason) {
      const rTxt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      rTxt.setAttribute('x', x);
      rTxt.setAttribute('y', y + 25);
      rTxt.setAttribute('text-anchor', 'middle');
      rTxt.setAttribute('font-size', '10');
      rTxt.setAttribute('font-weight', '600');
      rTxt.setAttribute('fill', pColor);
      rTxt.textContent = d.reason;
      svg.appendChild(rTxt);
    }
  });

  container.appendChild(svg);
}

// ─── AI 레포트 생성 (비동기) ──────────────────────────────
async function generateAIReport(resultId, scores, totalIndex, info) {
  try {
    const report = await api.generateReport({ resultId, ...info, scores, totalIndex });

    if (report.error) {
      console.error('API Error Details:', report.details);
      throw new Error(report.error);
    }

    renderAIReportToDOM(report);
  } catch (e) {
    console.error('AI 레포트 생성 실패:', e);
    ['rpt-summary', 'rpt-prophecy', 'rpt-academy-advice', 'rpt-advice'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.innerHTML = '<p class="ai-error" style="color:var(--c-error);">현재 AI 서버 접속량이 많거나 할당량이 초과되어 분석을 불러오지 못했습니다.<br>잠시 후 다시 시도해주세요.</p>';
    });
    document.querySelectorAll('.ai-loading-sm').forEach(el => {
      el.innerHTML = '<span style="color:var(--c-error);font-weight:bold;">분석 실패</span>';
    });
  }
}

// ─── PDF 저장 ─────────────────────────────────────────────
document.getElementById('btn-pdf').addEventListener('click', async () => {
  const btn = document.getElementById('btn-pdf');
  btn.disabled = true;
  btn.textContent = '생성 중...';

  try {
    document.body.classList.add('pdf-capture');

    // 강제로 리플로우(reflow)를 발생시켜 변경된 CSS(pdf-capture)를 렌더링에 즉시 반영
    void document.body.offsetHeight;

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const A4W = 210, A4H = 297;

    const pages = document.querySelectorAll('.pdf-page');
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const canvas = await html2canvas(page, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        width: page.scrollWidth,
        height: page.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.92);
      const canvasW = canvas.width;
      const canvasH = canvas.height;
      const ratio = canvasH / canvasW;
      const imgW = A4W;
      const imgH = imgW * ratio;

      if (i > 0) pdf.addPage();
      // 페이지가 A4보다 길면 비율 유지하여 축소
      if (imgH <= A4H) {
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW, imgH);
      } else {
        const scale = A4H / imgH;
        pdf.addImage(imgData, 'JPEG', 0, 0, imgW * scale, A4H);
      }
    }

    const name = state.userInfo.name || '결과';
    pdf.save(`공부EQ_${name}.pdf`);
  } catch (e) {
    console.error('PDF 생성 실패:', e);
    alert('PDF 생성 중 오류가 발생했습니다.');
  } finally {
    document.body.classList.remove('pdf-capture');
    btn.disabled = false;
    btn.textContent = 'PDF 저장';
  }
});

// ─── 다시 시작 ─────────────────────────────────────────────
document.getElementById('btn-restart').addEventListener('click', () => {
  state.answers = {}; state.userInfo = {}; state.resultId = null;
  state.scores = null; state.totalIndex = null;
  showScreen('info');
});

// 제출 완료 화면 "확인"
document.getElementById('btn-done-home').addEventListener('click', () => {
  window.location.href = '/mypage/';
});

// ─── URL 결과 불러오기 ─────────────────────────────────────
(async () => {
  const resultId = new URLSearchParams(location.search).get('result');
  if (!resultId) return;
  try {
    let data;
    if (resultId.startsWith('mock_')) {
      data = {
        name: resultId === 'mock_student_chulsoo' ? '김철수' : '김영희',
        grade: resultId === 'mock_student_chulsoo' ? 'mid1' : 'elem6',
        academies: '3개',
        advance: [{subject: '수학', advance: '1~2년'}, {subject: '영어', advance: '6개월 미만'}],
        scores: { '호감': 85, '체감': 70, '직감': 80, '관리': 75, '환경': 80, '관계': 90 },
        total_index: 120,
        created_at: Date.now(),
        ai_report: {
          summary: '전반적인 학업 정서가 매우 양호합니다.',
          categories: [
            { name: '호감', analysis: '학습에 대한 호감이 높습니다.' },
            { name: '체감', analysis: '학습 스트레스는 보통입니다.' },
            { name: '직감', analysis: '자기주도성이 있습니다.' },
            { name: '관리', analysis: '시간 관리가 양호합니다.' },
            { name: '환경', analysis: '가정 환경의 지지가 큽니다.' },
            { name: '관계', analysis: '친구/교사 관계가 원만합니다.' }
          ],
          prophecy: '### 학습 전망\n이대로 유지한다면 좋은 성과를 얻을 수 있습니다.',
          prediction_graph: [{grade: '초6', score: 110}, {grade: '중1', score: 120}],
          academy_advice: '### 학원 수강 조언\n현재 수강량이 적절합니다.',
          advice: '긍정적인 마음가짐을 계속 유지하세요.'
        }
      };
    } else {
      data = await api.getResult(resultId);
    }
    state.resultId = resultId;
    let parsedSubjects = [];
    try {
      parsedSubjects = typeof data.advance === 'string' ? JSON.parse(data.advance) : data.advance;
    } catch (e) { }

    const info = {
      name: data.name || '—',
      grade: data.grade || '—',
      academies: data.academies || '—',
      subjects: parsedSubjects || [],
    };
    state.userInfo = info;

    // DB 호환성: 예전 데이터의 '종합' 카테고리를 '관리'로 복사
    if (data.scores && data.scores['종합'] !== undefined && data.scores['관리'] === undefined) {
      data.scores['관리'] = data.scores['종합'];
    }

    state.scores = data.scores;
    state.totalIndex = data.total_index;
    renderReport(data.scores, data.total_index, info, data.created_at);
    showScreen('result');

    if (data.ai_report) {
      renderAIReportToDOM(data.ai_report);
    } else {
      generateAIReport(resultId, data.scores, data.total_index, info);
    }
  } catch (e) { console.warn('결과 불러오기 실패:', e); }
})();

initFromAccount();

