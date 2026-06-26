// 🔌 [BE-10] ACEQ 진단 백엔드(D1 studymental). 결과/AI레포트/승인/임시저장은 동작. 진단권·자녀매칭은 mockDb 의존 → 서버 통합 필요.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const CLAUDE_BASE = "https://api.anthropic.com/v1/messages";
const PRIMARY_MODEL = "claude-sonnet-4-6";
const FALLBACK_MODEL = "claude-haiku-4-5-20251001";

export default {
  async fetch(request, env, ctx) {
    try {
      if (request.method === "OPTIONS") {
        return new Response(null, { headers: CORS });
      }

      const url = new URL(request.url);
      const authHeader = request.headers.get("Authorization");
      const isAdmin = authHeader === (env.ADMIN_PASSWORD || "aceq2026");

      if (request.method === "PUT" && url.pathname === "/api/partial") {
        return await handlePutPartial(request, env);
      }
      if (request.method === "DELETE" && url.pathname === "/api/partial") {
        return await handleDeletePartial(request, env);
      }

      if (request.method === "POST") {
        if (url.pathname === "/api/results" || url.pathname === "/api/save") {
          return await handleSave(request, env);
        }
        if (
          url.pathname === "/api/report" ||
          url.pathname === "/api/generate_ai"
        ) {
          if (!isAdmin) {
            return json({ error: "Unauthorized" }, 401);
          }
          return await handleGenerateAI(request, env, ctx);
        }
        if (url.pathname === "/api/admin/approve") {
          if (!isAdmin) {
            return json({ error: "Unauthorized" }, 401);
          }
          return await handleApprove(request, env);
        }
      } else if (request.method === "GET") {
        if (url.pathname === "/api/partial") {
          return await handleGetPartial(request, env);
        }
        if (
          url.pathname === "/api/results" ||
          url.pathname === "/api/admin/results"
        ) {
          if (!isAdmin) {
            return json({ error: "Unauthorized" }, 401);
          }
          return await handleListResults(request, env);
        }
        if (
          url.pathname.startsWith("/api/results/") ||
          url.pathname === "/api/report"
        ) {
          return await handleGetReport(request, env);
        }
      } else if (request.method === "DELETE") {
        if (url.pathname.startsWith("/api/results/")) {
          if (!isAdmin) {
            return json({ error: "Unauthorized" }, 401);
          }
          return await handleDeleteResult(request, env);
        }
      }

      return new Response("Not found", { status: 404, headers: CORS });
    } catch (e) {
      console.error("Worker Global Error:", e);
      return json({ error: "Internal Server Error", message: e.message }, 500);
    }
  },
};

async function handleSave(request, env) {
  try {
    const data = await request.json();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO results (id, name, grade, gender, academies, advance, answers, scores, total_index, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        data.name || "",
        data.grade || "",
        "",
        data.academies || "",
        JSON.stringify(data.subjects || []),
        JSON.stringify(data.answers || {}),
        JSON.stringify(data.scores || {}),
        data.totalIndex || 0,
        now,
      )
      .run();

    return json({ success: true, id });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function ensureColumn(db, table, column, definition) {
  try {
    const info = await db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = info.results.some(col => col.name === column);
    if (!exists) {
      await db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`).run();
    }
  } catch (e) {
    console.error(`ensureColumn error for ${table}.${column}:`, e);
  }
}

async function handleListResults(request, env) {
  try {
    await ensureColumn(env.DB, "results", "is_deleted", "INTEGER DEFAULT 0");
    await ensureColumn(env.DB, "results", "report_approved", "INTEGER");
    const { results } = await env.DB.prepare(
      `SELECT id, name, grade, gender, academies, advance, total_index, created_at, report_approved,
       (CASE WHEN ai_report IS NOT NULL AND ai_report != '' THEN 1 ELSE 0 END) as has_report
       FROM results
       WHERE is_deleted = 0 OR is_deleted IS NULL
       ORDER BY created_at DESC`,
    ).all();
    return json(results);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handleDeleteResult(request, env) {
  try {
    await ensureColumn(env.DB, "results", "is_deleted", "INTEGER DEFAULT 0");
    const url = new URL(request.url);
    const id = url.pathname.split("/").pop();
    await env.DB.prepare(`UPDATE results SET is_deleted = 1 WHERE id = ?`).bind(id).run();
    return json({ success: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

// 레포트 승인/승인취소 — approved=true(기본): 고객에게 레포트 노출. false: 승인 대기(미노출).
// 🔌 [BE-12] 알림 발송 stub (로그만). 실제 채널(카카오 알림톡/SMS/이메일) 연동 필요. → docs/BACKEND_REQUIREMENTS.md
async function notifyReportApproved({ resultId, env }) {
  // TODO: [BE-12] 보호자 연락처 조회(공통 도메인) 후 "AC-EQ 레포트 준비 완료" 알림 발송.
  console.log(`[BE-14][ACEQ] report_ready notify → result=${resultId}`);
}

// 🔌 [BE-14] ACEQ 레포트 승인 시 보호자 알림. 승인(노출) 전환 시 발송 트리거. 실제 채널은 BE-12(stub).
async function handleApprove(request, env) {
  try {
    await ensureColumn(env.DB, "results", "report_approved", "INTEGER");
    const { id, approved } = await request.json();
    if (!id) return json({ error: "Missing id" }, 400);
    const willApprove = approved !== false;
    await env.DB.prepare(`UPDATE results SET report_approved = ? WHERE id = ?`)
      .bind(willApprove ? 1 : 0, id)
      .run();
    // 승인(노출) 전환 시에만 알림 발송.
    if (willApprove) {
      try { await notifyReportApproved({ resultId: id, env }); }
      catch (notifyErr) { console.error('[BE-14] ACEQ notify failed:', notifyErr); }
    }
    return json({ success: true, approved: willApprove });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}


async function handleGetReport(request, env) {
  try {
    await ensureColumn(env.DB, "results", "report_approved", "INTEGER");
    const url = new URL(request.url);
    let id = url.searchParams.get("id");
    if (!id && url.pathname.startsWith("/api/results/")) {
      id = url.pathname.split("/").pop();
    }
    if (!id) return json({ error: "Missing id" }, 400);

    const result = await env.DB.prepare(`SELECT * FROM results WHERE id = ?`)
      .bind(id)
      .first();
    if (!result) return json({ error: "Not found" }, 404);

    // 관리자 승인 게이트: 승인 대기(0)면 레포트 미제공(직접 URL 차단). NULL(기존)·1(승인)은 제공.
    if (result.report_approved === 0) {
      return json({ id: result.id, name: result.name, pending: true, ai_report: null });
    }

    result.answers = JSON.parse(result.answers || "{}");
    result.scores = JSON.parse(result.scores || "{}");
    if (result.ai_report) {
      result.ai_report = JSON.parse(result.ai_report);
    }

    return json(result);
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handleGenerateAI(request, env, ctx) {
  try {
    // console.log("call handleGenerateAI");
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400);
    }

    const {
      name,
      grade,
      academies,
      subjects,
      totalIndex,
      scores,
      resultId,
    } = body;

    const catDescriptions = {
      관리: "전반적인 공부 스트레스와 태도 (7문항)",
      "인정(사랑)": "인정과 칭찬에 대한 의존도 (5문항)",
      "가족(부모)": "부모님으로 인한 공부 스트레스 (5문항)",
      친구: "또래 관계가 공부에 미치는 영향 (5문항)",
      미래: "미래 불안이 현재 공부에 미치는 영향 (5문항)",
      자존심: "자존감과 경쟁 심리 (5문항)",
      호감: "공부 호감도 (학습에 대한 순수한 흥미, 지적 호기심, 책상에 앉는 것에 대한 긍정적 감정 상태를 의미합니다)",
      체감: "학습 효능감 (자신이 노력하면 성적이 오를 것이라는 믿음, 그리고 자신만의 구체적인 공부 방법론을 갖추고 있는지에 대한 감각입니다)",
      직감: "메타인지 능력 (자신이 아는 것과 모르는 것을 정확히 구분하고, 스스로의 상태를 객관적으로 진단하여 학습 방향을 수정하는 능력입니다)",
    };

    const NORMS = {
      전체: { mean: 58.2, std: 11.94 },
      관리: { mean: 59.95, std: 12.4 },
      호감: { mean: 59.67, std: 14.75 },
      체감: { mean: 53.49, std: 19.13 },
      직감: { mean: 55.42, std: 18.46 },
      "인정(사랑)": { mean: 63.49, std: 11.91 },
      "가족(부모)": { mean: 64.02, std: 12.67 },
      친구: { mean: 71.14, std: 9.24 },
      미래: { mean: 56.42, std: 17.19 },
      자존심: { mean: 55.21, std: 15.79 },
    };

    const toIdx = (pct, cat) => {
      const norm = NORMS[cat] || NORMS["전체"];
      return Math.round(
        Math.min(160, Math.max(40, 100 + (15 * (pct - norm.mean)) / norm.std)),
      );
    };

    const catOrder = [
      "호감",
      "체감",
      "직감",
      "관리",
      "인정(사랑)",
      "가족(부모)",
      "친구",
      "미래",
      "자존심",
    ];
    const getLevelLabel = (idx) => {
      if (idx >= 130) return "매우 우수";
      if (idx >= 115) return "우수";
      if (idx >= 85) return "보통";
      if (idx >= 70) return "취약";
      return "매우 취약";
    };

    const scoreLines = catOrder
      .map((cat) => {
        let pct = scores[cat];
        if (pct === undefined && cat === "관리") pct = scores["종합"];
        pct = pct ?? 0;
        const idx = toIdx(pct, cat);
        const level = getLevelLabel(idx);
        return `- ${cat}: ${idx}점 (진단: ${level})`;
      })
      .join("\n");

    const systemPrompt = `당신은 학생의 학업정서(EQ)(자기주도성과 공부를 지속하는 힘)를 정밀하게 분석하는 전문 심리교육 분석가입니다. 출력은 반드시 요구된 JSON 형식으로만 응답해야 하며, 어떠한 마크다운 코드 블록이나 추가 설명도 포함해서는 안 됩니다.`;

    const userPrompt = `아래 데이터를 바탕으로 한국어 레포트를 작성해주세요.

[응답자 정보]
- 이름: ${name}
- 학년: ${grade}
- 총 학원·과외 개수: ${academies}
- 수강 과목 및 선행 진도: ${subjects && subjects.length > 0 ? subjects.map((s) => `${s.subject}(${s.advance})`).join(", ") : "없음"}

[학업정서(EQ)]
- 종합 지수: ${totalIndex}점 (보통 100, 표준편차 15 기준)

[영역별 지수] (웩슬러 IQ 방식, 보통 100)
* 중요: 모든 지수는 웩슬러 방식(평균 100, 표준편차 15)입니다. 100점 부근은 '보통' 수준입니다. 점수가 높을수록 해당 영역의 상태가 긍정적이고 건강합니다.

[지수 해석 가이드라인] (절대 준수)
1. '매우 취약': 해당 영역으로 인해 매우 심각한 스트레스를 받고 있거나, 학업에 매우 부정적인 영향을 미치고 있는 위기 상태입니다. 반드시 이 심각성을 분석에 반영하십시오.
2. '취약': 해당 영역이 학습의 장애물로 작용하고 있는 상태입니다. 긍정적으로 포장하지 말고 개선이 필요한 지점임을 명확히 서술하십시오.
3. '보통': 특별한 문제는 없으나 강점도 아닌 평이한 수준입니다.
4. '우수/매우 우수': 해당 영역이 학습을 이끄는 긍정적인 동력이 되고 있는 상태입니다.

[영역별 낮은 점수(85점 미만)일 때의 해석 지침]
- 인정(사랑): 점수가 낮을수록 칭찬과 인정에 대한 의존도가 높아 스스로 공부할 힘이 결핍된 상태입니다.
- 가족(부모): 점수가 낮을수록 부모님으로 인한 공부 스트레스가 매우 높고 압박감을 느끼는 상태입니다.
- 친구: 점수가 낮을수록 또래 관계로 인한 스트레스가 크고 비교/경쟁으로 인해 공부에 방해를 받는 상태입니다.
- 미래: 점수가 낮을수록 미래에 대한 막연한 불안감이 크고 현재 공부에 집중하지 못하는 상태입니다.
- 자존심: 점수가 낮을수록 열등감이 강하고 자존감이 낮아 학업 지속력이 취약한 상태입니다.

${scoreLines}

[작성 지침]
다음 JSON 형식으로만 응답하세요. JSON 외 다른 텍스트는 절대 포함하지 마세요.
분석 시 반드시 제공된 '(진단: 등급)' 정보를 최우선으로 반영하십시오. 예를 들어 '매우 취약' 등급인 영역을 '다소 스트레스가 있다'거나 '완전히 문제적이지 않다'는 식으로 완곡하게 표현하는 것은 명백한 오진입니다. 해당 등급에 걸맞은 정확하고 엄격한 어조를 사용하여 학생의 현재 위기 상태를 분명히 전달하세요.

{
  "summary": "반드시 공백 포함 한글 기준 300자 정도로 작성할 것. 학생의 학업정서(EQ)(자기주도성과 공부를 지속하는 힘) 전체를 한눈에 파악할 수 있는 총평. 점수나 수치를 언급하지 말고, 학생의 현재 마음 상태와 잠재력, 그리고 진짜 문제점이 무엇인지를 분석해주세요. 학생과 학부모님이 함께 읽을 레포트이므로 친절하고 이해하기 쉬운 일상적인 단어(~합니다, ~해요)를 사용하세요.",

  "categories": [
    {
      "name": "카테고리명",
      "index": 숫자,
      "analysis": "이 카테고리가 '호감, 체감, 직감, 관리' 중 하나라면 반드시 공백 포함 한글 기준 300자 정도로 상세히 작성할 것. '인정(사랑), 가족(부모), 친구, 미래, 자존심' 중 하나라면 반드시 공백 포함 한글 기준 200자 내외로 상세히 작성할 것. 모든 분석은 추상적이지 않고 구체적이어야 하며 수치 언급은 금지합니다."
    }
  ],

  "prophecy": "반드시 공백 포함 소제목 포함 한글 기준 700자 정도로 할 것. 가장 중요한 파트입니다. 앞서 분석한 데이터들을 종합하여 향후 학교 생활이나 성적, 심리 상태에 어떤 영향을 미칠지 매우 상세하게 예측해주세요. 내용을 3개 정도의 소주제로 나누어 작성하고, 각 소주제는 '### 소제목' 형식을 사용하고 줄바꿈을 하여 문단으로 구성하세요.",

  "prediction_graph": [
    { "grade": "현재학년", "score": 숫자(현재 종합지수), "reason": "현재 상태 요약 (7자 이내)" },
    { "grade": "다음학년", "score": 숫자(예상지수), "reason": "예상 변화 이유 (7자 이내)" }
  ],
  "__prediction_graph_instruction": "주의: 한국의 학년 체계는 [초1, 초2, 초3, 초4, 초5, 초6, 중1, 중2, 중3, 고1, 고2, 고3] 입니다. prediction_graph 배열은 반드시 사용자가 기입한 현재 학년을 시작점으로 하여 '고3'까지 매 학년을 x축으로 하여 빠짐없이 순서대로 전부 포함해야 합니다. y축 점수(score)는 시각적 변동폭을 크게 보여주기 위해 가급적 80~120 사이의 값으로 산출하세요.",

  "academy_advice": "반드시 공백 포함 소제목 포함 한글 기준 600자 정도로 할 것. 선행 및 자기주도성 분석 파트입니다. 입력된 학원/과외 개수 및 선행 진도 현황과 EQ 점수들을 종합 분석하여, 현재 사교육 스케줄과 선행 학습 진도가 학생의 자기주도성에 어떤 영향을 미치고 있는지 평가해주세요. 향후 예측 결과처럼 내용을 3개 정도의 소주제로 나누어 작성하고, 각 소주제는 '### 소제목' 형식을 사용하며 반드시 줄바꿈을 하여 여러 문단으로 상세하게 구성하세요.",

  "advice": "반드시 공백 포함 한글 기준 한 문단으로 400자 정도로 할 것. 학생이 당장 실천할 수 있는 가장 핵심적인 심리적, 학습적 조언을 제안해주세요. 1) Why 2) How 3) What 을 포함하여 다정하게 작성하세요."
}

categories 배열은 다음 순서로 모든 9개 카테고리를 포함: 호감, 체감, 직감, 관리, 인정(사랑), 가족(부모), 친구, 미래, 자존심`.trim();

    // console.log(systemPrompt);
    // console.log(",");
    // console.log(userPrompt);

    const result = await callClaude(
      systemPrompt,
      userPrompt,
      env.CLAUDE_API_KEY,
    );

    if (result.error) {
      console.log(result.error);
      return json(result, 500);
    }

    if (resultId) {
      ctx.waitUntil(
        (async () => {
          try {
            await ensureColumn(env.DB, "results", "report_approved", "INTEGER");
            await env.DB.prepare(
              // 신규 레포트 → 관리자 승인 대기(0). 이미 승인(1)이면 유지(재생성 시 재검토 불필요).
              `UPDATE results SET ai_report = ?, report_approved = COALESCE(report_approved, 0) WHERE id = ?`,
            )
              .bind(JSON.stringify(result), resultId)
              .run();
            console.log(`DB saved for resultId: ${resultId}`);
          } catch (e) {
            console.error("ai_report 저장 실패:", e);
          }
        })(),
      );
    }

    return json(result);
  } catch (e) {
    console.error("handleGenerateAI error:", e);
    return json(
      { error: "AI 생성 중 서버 오류가 발생했습니다.", details: e.message },
      500,
    );
  }
}

async function callClaude(systemPrompt, userPrompt, apiKey) {
  const errors = [];

  console.log("callClaude");
  for (const model of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    try {
      const res = await fetch(CLAUDE_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 8192,
          temperature: 0.5,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });

      console.log(`[${model}] Claude 호출 결과:`, res.status, res.statusText);
      // console.log("Response Data:", JSON.stringify(res, null, 2));

      if (!res.ok) {
        const err = await res.text();
        console.warn(`[${model}] ${res.status}: ${err}`);
        errors.push(`[${model}] ${res.status}: ${err}`);
        continue;
      }

      const data = await res.json();
      let text = data.content?.[0]?.text;

      if (!text) {
        errors.push(`[${model}] 응답 비어있음`);
        continue;
      }

      // 마크다운 백틱 제거
      let cleaned = text.replace(/```json|```/g, "").trim();

      // 첫 번째 '{' 부터 마지막 '}' 까지만 정확히 추출 (불필요한 앞뒤 텍스트 제거)
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }

      // 후행 콤마 제거 등 포맷팅 보정
      cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");

      try {
        return JSON.parse(cleaned);
      } catch (parseErr) {
        // 값 내부의 실제 줄바꿈(리터럴 개행)이 이스케이프 되지 않아 에러가 발생한 경우를 대비해
        // 제어 문자를 단순 공백으로 임시 치환하여 파싱 시도
        try {
          let robustCleaned = cleaned.replace(/[\n\r\t]+/g, " ");
          return JSON.parse(robustCleaned);
        } catch (e) {
          errors.push(
            `[${model}] JSON Parse Failed: ${parseErr.message} | Text: ${text}`,
          );
        }
      }
    } catch (e) {
      console.warn(`[${model}] 오류:`, e.message);
      errors.push(`[${model}] API Error: ${e.message}`);
    }
  }
  return { error: "Claude API 호출 실패", details: errors };
}

async function ensurePartialTable(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS partial_sessions (
      student_id TEXT PRIMARY KEY,
      answers    TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `).run();
}

async function handleGetPartial(request, env) {
  try {
    await ensurePartialTable(env.DB);
    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId");
    if (!studentId) return json({ error: "studentId 필요" }, 400);
    const row = await env.DB.prepare(
      "SELECT answers FROM partial_sessions WHERE student_id = ?"
    ).bind(studentId).first();
    return json({ answers: row ? JSON.parse(row.answers) : null });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handlePutPartial(request, env) {
  try {
    await ensurePartialTable(env.DB);
    const { studentId, answers } = await request.json();
    if (!studentId) return json({ error: "studentId 필요" }, 400);
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO partial_sessions (student_id, answers, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(student_id) DO UPDATE SET answers = excluded.answers, updated_at = excluded.updated_at`
    ).bind(studentId, JSON.stringify(answers), now).run();
    return json({ success: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

async function handleDeletePartial(request, env) {
  try {
    await ensurePartialTable(env.DB);
    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId");
    if (!studentId) return json({ error: "studentId 필요" }, 400);
    await env.DB.prepare("DELETE FROM partial_sessions WHERE student_id = ?").bind(studentId).run();
    return json({ success: true });
  } catch (e) {
    return json({ error: e.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
