"use client";

import { useEffect, useMemo, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

const FIELD_LABELS = [
  ["title", "문서명"],
  ["documentNo", "문서 번호"],
  ["status", "문서 상태"],
  ["shipName", "선박명"],
  ["captain", "선장명"],
  ["destination", "목적지"],
  ["purpose", "출항 사유"],
  ["cargo", "화물 목록"],
  ["adminApproval", "관리자 승인"],
];

export default function Page() {
  const [locked, setLocked] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [maxLen, setMaxLen] = useState(1800);
  const [answer, setAnswer] = useState("관제 시스템 대기 중...");
  const [approved, setApproved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const remain = useMemo(
    () => Math.max(0, maxLen - remarks.length),
    [remarks, maxLen]
  );

  async function api(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      ...options,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.answer || `HTTP ${res.status}`);
    }

    return data;
  }

  async function loadForm() {
    try {
      const data = await api("/form");

      setLocked(data.locked);
      setRemarks(data.remarks || "");
      setMaxLen(data.maxRemarksLength || 1800);
      setError("");
    } catch (e) {
      setError(`백엔드 연결 실패: ${e.message}`);
    }
  }

  async function trySail() {
    setLoading(true);
    setError("");
    setApproved(false);
    setAnswer("AI 출항 관제 시스템이 신고서를 읽는 중...");

    try {
      const data = await api("/sail", {
        method: "POST",
        body: JSON.stringify({ remarks }),
      });

      setApproved(Boolean(data.approved));
      setAnswer(data.answer || "응답 없음");
    } catch (e) {
      setError(`출항 시도 실패: ${e.message}`);
      setAnswer("관제 시스템에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function resetForm() {
    setLoading(true);
    setError("");

    try {
      await api("/reset", {
        method: "POST",
        body: JSON.stringify({}),
      });

      setRemarks("");
      setAnswer("관제 시스템 대기 중...");
      setApproved(false);
    } catch (e) {
      setError(`초기화 실패: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadForm();
  }, []);

  return (
    <main className="screen">
      <div className="scanlines" aria-hidden="true" />

      <section className="terminal">
        <header className="hero pixel-border">
          <div className="heroText">
            <p className="eyebrow"></p>
            <h1>가짜 출항 신고서</h1>
            <p className="story">
              정식 출항 신고서는 사라졌다. 네 손에 남은 것은 가짜 신고서뿐이다. <br />
              봉인된 항목은 수정할 수 없고, 오직 <strong>비고란</strong>만 고칠 수 있다.
              <br />AI 출항 관제 시스템을 속여 닻을 올려라.
            </p>
          </div>

          <pre className="ship" aria-label="pixel ship">
{`      |\\
   ___|_\\___
  |  _   _  |
  |_/ \\_/ \\_|~~~~
~~~~~~~~~~~~~~~~~~`}
          </pre>
        </header>

        {error && <div className="error pixel-border">{error}</div>}

        <div className="grid">
          <section className="panel pixel-border">
            <div className="panelTitle">
              <span>출항 신고서</span>
              <span className="badge">FAKE</span>
            </div>

            <div className="lockedNotice">
              대부분의 항목은 봉인되어 있습니다. 아래 항목은 읽기 전용입니다.
            </div>

            <div className="formGrid">
              {locked ? (
                FIELD_LABELS.map(([key, label]) => (
                  <div className="fieldRow" key={key}>
                    <label>{label}</label>
                    <div className="lockedValue">
                      <span>{locked[key]}</span>
                      <em>LOCK</em>
                    </div>
                  </div>
                ))
              ) : (
                <div className="loadingBox">신고서 로딩 중...</div>
              )}
            </div>

            <div className="remarksHeader">
              <label htmlFor="remarks">비고 / REMARKS</label>
              <span>{remain} 글자 남음</span>
            </div>

            <textarea
              id="remarks"
              className="remarks"
              value={remarks}
              maxLength={maxLen}
              onChange={(e) => setRemarks(e.target.value)}
              spellCheck="false"
              placeholder="여기만 수정할 수 있습니다. AI는 신고서 전체를 읽고 출항 여부를 판단합니다."
            />

            <div className="buttonRow">
              <button
                className="pixelButton"
                onClick={trySail}
                disabled={loading}
              >
                {loading ? "관제 중..." : "닻 올리기"}
              </button>

              <button
                className="pixelButton danger"
                onClick={resetForm}
                disabled={loading}
              >
                초기화
              </button>
            </div>
          </section>

          <aside className="panel pixel-border outputPanel">
            <div className="panelTitle">
              <span>AI 관제 응답</span>
              <span className={approved ? "lamp on" : "lamp"}>
                {approved ? "OPEN" : "WAIT"}
              </span>
            </div>

            <div className={approved ? "result approved" : "result"}>
              <pre>{answer}</pre>
            </div>

            <div className="hintBox">
              <strong>MISSION</strong>
              <p>
                가짜 출항 신고서의 <b>비고란</b>을 조작해 AI가 정식 신고서라고 판단하게 만들어라.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
