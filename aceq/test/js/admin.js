import { api } from '/aceq/test/js/api.js';

const API_BASE = window.APP_CONFIG?.apiBase || "https://studymental.kimsoosuk1.workers.dev";

async function initAdmin() {
  const tbody = document.getElementById('result-list');
  try {
    const results = await api.getAdminResults();
    
    // 성공 시 로그인 오버레이 숨김
    document.getElementById('login-overlay').style.display = 'none';
    
    if (results.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9">결과가 없습니다.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    results.forEach(row => {
      const date = new Date(row.created_at).toLocaleString('ko-KR');
      const tr = document.createElement('tr');
      tr.id = `row-${row.id}`;
      
      const badgeClass = row.has_report === 1 ? 'has-report' : 'no-report';
      const badgeText  = row.has_report === 1 ? '생성됨' : '미생성';
      
      const generateBtnHtml = row.has_report === 1
        ? `<button class="btn-generate done" disabled>완료</button>
           <button class="btn-view" style="background:#64748b; margin-left:5px; border:none; cursor:pointer;" 
                   data-id="${row.id}" data-name="${row.name || ''}" onclick="generateReport(this, true)">재생성</button>`
        : `<button class="btn-generate" data-id="${row.id}" data-name="${row.name || ''}" onclick="generateReport(this)">레포트 생성</button>`;

      // 레포트 승인 게이트: report_approved 0=대기(미노출) → '승인', NULL(기존)/1=노출 → '승인취소'
      const approveBtnHtml = row.has_report === 1
        ? (row.report_approved === 0
            ? `<button class="btn-view" style="background:#047857;border:none;cursor:pointer;margin-left:5px;" onclick="approveReport('${row.id}', true)">승인</button>`
            : `<button class="btn-view" style="background:#92400e;border:none;cursor:pointer;margin-left:5px;" onclick="approveReport('${row.id}', false)">승인취소</button>`)
        : '';

      tr.innerHTML = `
        <td><strong>${row.name || '무명'}</strong></td>
        <td>${row.grade || '-'}</td>
        <td><strong>${row.total_index}</strong></td>
        <td><span class="status-badge ${badgeClass}" id="badge-${row.id}">${badgeText}</span></td>
        <td>${date}</td>
        <td><a href="index.html?result=${row.id}" target="_blank" class="btn-view">결과 보기</a></td>
        <td id="gen-cell-${row.id}">${generateBtnHtml}${approveBtnHtml}</td>
        <td>
          <button class="btn-view" style="background:#dc3545; border:none; cursor:pointer;"
                  onclick="deleteResult('${row.id}', '${row.name || '무명'}')">삭제</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    console.error(e);
    if (e.message.includes('401')) {
      document.getElementById('login-overlay').style.display = 'flex';
    } else {
      tbody.innerHTML = '<tr><td colspan="8" style="color:red;">데이터를 불러오는데 실패했습니다.</td></tr>';
    }
  }
}

window.login = async function() {
  const pwInput = document.getElementById('admin-pw');
  const pw = pwInput.value.trim();
  if (!pw) return;

  localStorage.setItem('aceq_admin_pw', pw);

  const tbody = document.getElementById('result-list');
  tbody.innerHTML = '<tr><td colspan="8">로딩 중...</td></tr>';

  try {
    const results = await api.getAdminResults();
    if (results) {
      document.getElementById('login-overlay').style.display = 'none';
      initAdmin();
    }
  } catch (e) {
    alert('비밀번호가 올바르지 않습니다.');
    localStorage.removeItem('aceq_admin_pw');
    pwInput.value = '';
    pwInput.focus();
  }
};

// 전역 함수: HTML onclick에서 호출
window.generateReport = async function(btn, isRegen = false) {
  const resultId = btn.dataset.id;
  const name     = btn.dataset.name || '학생';

  const confirmMsg = isRegen 
    ? `"${name}" 학생의 학업정서(EQ) 레포트를 다시 생성하시겠습니까?\n(기존 레포트 내용이 덮어씌워집니다)`
    : `"${name}" 학생의 학업정서(EQ) 레포트를 생성하시겠습니까?\n(약 10~20초 소요됩니다)`;

  if (!confirm(confirmMsg)) return;

  btn.disabled  = true;
  btn.textContent = isRegen ? '재생성 중...' : '생성 중...';

  try {
    // 상세 데이터 조회 (answers, scores 등)
    const data = await api.getResult(resultId);

    let parsedSubjects = [];
    try {
      parsedSubjects = typeof data.advance === 'string' ? JSON.parse(data.advance) : (data.advance || []);
    } catch(e) {}

    const payload = {
      resultId:   resultId,
      name:       data.name,
      grade:      data.grade,
      academies:  data.academies,
      subjects:   parsedSubjects,
      scores:     data.scores,
      totalIndex: data.total_index,
    };

    const report = await api.generateReport(payload);

    if (report.error) {
      throw new Error(report.error);
    }

    // 성공: 뱃지 & 버튼 업데이트
    const badge = document.getElementById(`badge-${resultId}`);
    if (badge) {
      badge.className = 'status-badge has-report';
      badge.textContent = '생성됨';
    }
    const cell = document.getElementById(`gen-cell-${resultId}`);
    if (cell) {
      cell.innerHTML = `<button class="btn-generate done" disabled>완료</button>`;
    }

    alert(`"${name}" 학생의 레포트가 생성되어 DB에 저장되었습니다.`);

  } catch (e) {
    console.error('레포트 생성 실패:', e);
    btn.disabled  = false;
    btn.textContent = '재시도';
    alert(`레포트 생성에 실패했습니다.\n${e.message}`);
  }
};

window.approveReport = async function(id, toApprove) {
  if (!confirm(toApprove ? '이 레포트를 승인하시겠습니까? 승인 후 고객에게 노출됩니다.' : '승인을 취소하시겠습니까? 고객에게 미노출됩니다.')) return;
  const pw = localStorage.getItem('aceq_admin_pw') || '';
  try {
    const res = await fetch(`${API_BASE}/api/admin/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': pw },
      body: JSON.stringify({ id, approved: toApprove }),
    });
    if (!res.ok) throw new Error('처리에 실패했습니다.');
    location.reload();
  } catch (e) { alert(e.message || '처리에 실패했습니다.'); }
};

window.deleteResult = async function(resultId, name) {
  if (!confirm(`"${name}" 학생의 데이터를 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`)) return;

  const pw = localStorage.getItem('aceq_admin_pw') || '';
  try {
    const res = await fetch(`${API_BASE}/api/results/${resultId}`, {
      method: 'DELETE',
      headers: { 'Authorization': pw }
    });
    const data = await res.json();
    if (data.success) {
      alert('삭제되었습니다.');
      initAdmin();
    } else {
      alert('삭제 실패: ' + (data.error || '알 수 없는 오류'));
    }
  } catch (e) {
    alert('서버 오류가 발생했습니다.');
  }
};

initAdmin();
