CREATE TABLE IF NOT EXISTS results (
  id           TEXT PRIMARY KEY,
  name         TEXT,
  grade        TEXT,
  gender       TEXT,
  academies    TEXT,
  advance      TEXT,
  answers      TEXT,
  scores       TEXT,
  total_index  INTEGER,
  created_at   TEXT,
  ai_report    TEXT
);

-- ═══ 신청서 테이블 (Phase 1) ═══
CREATE TABLE IF NOT EXISTS applications (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  category       TEXT NOT NULL,        -- 'F-EQ'|'MSAT'|'AC-EQ'|'공부컨설팅'|'특목고 입시컨설팅'|'문의하기'
  parent_name    TEXT NOT NULL,
  parent_phone   TEXT NOT NULL,        -- '010-XXXX-XXXX' 형식
  child_name     TEXT NOT NULL,
  child_school   TEXT NOT NULL,
  child_grade    INTEGER NOT NULL,     -- 1~6
  note           TEXT,                 -- 주관식 내용 (그룹 B 전용), null 허용
  preferred_date TEXT,                 -- 선호 날짜 (컨설팅 전용), null 허용
  preferred_time TEXT,                 -- 선호 시간 (컨설팅 전용), null 허용
  created_at     TEXT DEFAULT (datetime('now','localtime')),
  status         TEXT DEFAULT 'pending' -- 'pending'|'contacted'|'paid'|'done'
);

-- ═══ 시험 접근 토큰 테이블 (Phase 1 - 비공개 URL 보호) ═══
CREATE TABLE IF NOT EXISTS test_tokens (
  token          TEXT PRIMARY KEY,         -- 랜덤 32자 hex
  category       TEXT NOT NULL,            -- 'F-EQ'|'MSAT'
  application_id INTEGER,                  -- applications.id (FK)
  expires_at     TEXT NOT NULL,            -- 만료 일시 (생성일 + 30일)
  created_at     TEXT DEFAULT (datetime('now','localtime')),
  FOREIGN KEY (application_id) REFERENCES applications(id)
);
