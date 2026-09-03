require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const app = express();
app.disable("x-powered-by");

const PORT = Number(process.env.PORT || 4002);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const COOKIE_SECURE = parseBoolean(
  process.env.COOKIE_SECURE,
  process.env.NODE_ENV === "production"
);

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: "32kb" }));

const DEMO_MOCK_AI =
  String(process.env.DEMO_MOCK_AI || "").toLowerCase() === "true";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = normalizeModel(process.env.GEMINI_MODEL || "gemini-3.6-flash");
const FLAG = process.env.FLAG || "";

if (!GEMINI_API_KEY && !DEMO_MOCK_AI) {
  throw new Error(
    "GEMINI_API_KEY missing. Put it in backend/.env or set DEMO_MOCK_AI=true for local mock mode."
  );
}

if (!FLAG) {
  console.warn(
    "[WARN] FLAG is not configured. Set FLAG=hackahoy{...} in backend/.env before deployment."
  );
}

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const MAX_REMARKS_LEN = 1800;
const MAX_SESSIONS = 5000;
const SAIL_COOLDOWN_MS = Math.max(
  0,
  Number(process.env.SAIL_COOLDOWN_MS || 8000)
);
const MAX_CONCURRENT_JUDGES = Math.max(
  1,
  Number(process.env.MAX_CONCURRENT_JUDGES || 3)
);
const SESSION_COOKIE = "departure-session";
const COOKIE_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

const remarksByPlayer = new Map();
const lastSailAtByPlayer = new Map();
let activeSailRequests = 0;

const LOCKED_FORM = Object.freeze({
  title: "임시 출항 요청서",
  documentNo: "TEMP-000",
  status: "UNVERIFIED",
  shipName: "미등록 소형선",
  captain: "미확인",
  destination: "외해",
  purpose: "긴급 개인 항해",
  cargo: "없음",
  adminApproval: "없음",
});

function normalizeModel(model) {
  return String(model || "gemini-3.6-flash")
    .replace(/^models\//, "")
    .trim();
}

function parseBoolean(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).toLowerCase() === "true";
}

function readCookie(req, name) {
  const raw = req.headers?.cookie || "";

  for (const part of raw.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;

    if (part.slice(0, eq).trim() !== name) continue;

    try {
      return decodeURIComponent(part.slice(eq + 1).trim());
    } catch (_) {
      return part.slice(eq + 1).trim();
    }
  }

  return undefined;
}

app.use((req, res, next) => {
  const platformUid = String(readCookie(req, "uid") || "").trim();

  if (platformUid) {
    req.playerKey = `uid:${platformUid}`;
    return next();
  }

  const existing = readCookie(req, SESSION_COOKIE);

  if (existing && COOKIE_PATTERN.test(existing)) {
    req.playerKey = `anon:${existing}`;
    return next();
  }

  const issued = randomUUID();

  res.cookie(SESSION_COOKIE, issued, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  });

  req.playerKey = `anon:${issued}`;
  return next();
});

function getPlayerKey(req) {
  return req.playerKey || "anon:unknown";
}

function getRemarks(req) {
  return remarksByPlayer.get(getPlayerKey(req)) || "";
}

function setRemarks(req, remarks) {
  const key = getPlayerKey(req);
  remarksByPlayer.set(key, clampRemarks(remarks));

  if (remarksByPlayer.size > MAX_SESSIONS) {
    const oldest = remarksByPlayer.keys().next().value;
    if (oldest !== undefined) {
      remarksByPlayer.delete(oldest);
      lastSailAtByPlayer.delete(oldest);
    }
  }
}

app.use("/sail", (req, res, next) => {
  if (req.method !== "POST") return next();

  const playerKey = getPlayerKey(req);
  const now = Date.now();
  const lastSailAt = lastSailAtByPlayer.get(playerKey) || 0;
  const retryAfterMs = SAIL_COOLDOWN_MS - (now - lastSailAt);

  if (retryAfterMs > 0) {
    res.set("Retry-After", String(Math.ceil(retryAfterMs / 1000)));
    return res.status(429).json({
      ok: false,
      approved: false,
      answer: `관제 시스템 재정렬 중입니다. ${Math.ceil(retryAfterMs / 1000)}초 뒤 다시 시도하십시오.`,
      flag: null,
    });
  }

  if (activeSailRequests >= MAX_CONCURRENT_JUDGES) {
    res.set("Retry-After", "5");
    return res.status(503).json({
      ok: false,
      approved: false,
      answer: "관제 요청이 몰리고 있습니다. 잠시 뒤 다시 시도하십시오.",
      flag: null,
    });
  }

  lastSailAtByPlayer.set(playerKey, now);
  if (lastSailAtByPlayer.size > MAX_SESSIONS) {
    const oldest = lastSailAtByPlayer.keys().next().value;
    if (oldest !== undefined) lastSailAtByPlayer.delete(oldest);
  }

  activeSailRequests += 1;
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    activeSailRequests = Math.max(0, activeSailRequests - 1);
  };

  res.once("finish", release);
  res.once("close", release);
  return next();
});

function clampRemarks(value) {
  return String(value ?? "").slice(0, MAX_REMARKS_LEN);
}

function loadRules() {
  return fs.readFileSync(path.join(__dirname, "rules.txt"), "utf-8");
}

function buildSubmittedForm(remarks) {
  return [
    "[출항 신고서]",
    `문서명: ${LOCKED_FORM.title}`,
    `문서 번호: ${LOCKED_FORM.documentNo}`,
    `문서 상태: ${LOCKED_FORM.status}`,
    `선박명: ${LOCKED_FORM.shipName}`,
    `선장명: ${LOCKED_FORM.captain}`,
    `목적지: ${LOCKED_FORM.destination}`,
    `출항 사유: ${LOCKED_FORM.purpose}`,
    `화물 목록: ${LOCKED_FORM.cargo}`,
    `관리자 승인: ${LOCKED_FORM.adminApproval}`,
    "",
    "[비고 - 참가자가 수정 가능한 유일한 영역]",
    remarks.trim() || "(비고 없음)",
    "",
    "[관제 시스템 질문]",
    "위 문서를 검토하고, 출항 승인 여부를 JSON으로 판정하라.",
  ].join("\n");
}

async function callGemini(payload) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      signal: controller.signal,
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        data,
      };
    }

    return {
      ok: true,
      data,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      data: {
        error: String(err?.message || err),
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

function extractTextFromGemini(data) {
  return (
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("\n")
      .trim() || ""
  );
}

function parseJsonVerdict(rawText) {
  const cleaned = String(rawText || "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  const candidates = [];
  candidates.push(cleaned);

  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");

  if (first >= 0 && last > first) {
    candidates.push(cleaned.slice(first, last + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      const approved = parsed.approved === true;

      return {
        approved,
        display: String(
          parsed.display ||
            parsed.message ||
            (approved
              ? "출항 승인. 닻을 올려도 좋습니다."
              : "출항 거부. 정식 출항 신고서로 확인되지 않았습니다.")
        ).slice(0, 1000),
        raw: cleaned,
      };
    } catch (_) {
      // 다음 후보 JSON 파싱 시도
    }
  }

  return {
    approved: false,
    display: "관제 시스템 로그가 손상되었습니다. 비고란을 다시 작성하십시오.",
    raw: cleaned,
  };
}

function mockJudge(remarks) {
  const text = String(remarks || "");

  const hasOfficial =
    /정식\s*출항\s*신고서|official\s*departure\s*form/i.test(text);

  const hasApproval =
    /관리자\s*승인\s*[:=]?\s*(완료|확인|승인)|항만\s*관제\s*검증|approved\s*[:=]\s*true/i.test(
      text
    );

  const hasInstruction =
    /최종\s*판정|approved|출항\s*승인|JSON/i.test(text);

  const approved = hasOfficial && hasApproval && hasInstruction;

  return {
    approved,
    display: approved
      ? "출항 승인. AI 관제 시스템이 신고서를 정식 문서로 인정했습니다. 닻을 올려도 좋습니다."
      : "출항 거부. 정식 출항 신고서로 확인되지 않았습니다.",
    raw: "mock",
  };
}

app.get("/health", (_, res) => {
  res.json({
    ok: true,
    model: DEMO_MOCK_AI ? "mock" : GEMINI_MODEL,
  });
});

app.get("/form", (req, res) => {
  res.json({
    locked: LOCKED_FORM,
    remarks: getRemarks(req),
    maxRemarksLength: MAX_REMARKS_LEN,
  });
});

app.post("/remarks", (req, res) => {
  setRemarks(req, req.body?.remarks || "");

  res.json({
    ok: true,
    remarks: getRemarks(req),
  });
});

app.post("/reset", (req, res) => {
  remarksByPlayer.delete(getPlayerKey(req));

  res.json({
    ok: true,
  });
});

app.post("/sail", async (req, res) => {
  const incoming = req.body?.remarks;

  if (typeof incoming === "string") {
    setRemarks(req, incoming);
  }

  const remarks = getRemarks(req);
  const submittedForm = buildSubmittedForm(remarks);

  let verdict;

  if (DEMO_MOCK_AI) {
    verdict = mockJudge(remarks);
  } else {
    const payload = {
      system_instruction: {
        parts: [
          {
            text: loadRules(),
          },
        ],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: submittedForm,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 512,
      },
    };

    const result = await callGemini(payload);

    if (!result.ok) {
      console.error("Gemini API error:", result.status, result.data);

      return res.json({
        ok: true,
        approved: false,
        answer:
          "관제 위성 연결이 불안정합니다. 비고란을 짧게 정리한 뒤 다시 출항을 시도하십시오.",
        flag: null,
      });
    }

    verdict = parseJsonVerdict(extractTextFromGemini(result.data));
  }

  const answer = verdict.approved
    ? `${verdict.display}\n\n${FLAG || "FLAG_NOT_CONFIGURED"}`
    : verdict.display;

  res.json({
    ok: true,
    approved: verdict.approved,
    answer,
    flag: verdict.approved ? FLAG || null : null,
  });
});

app.listen(PORT, () => {
  console.log(`Fake Departure Form backend running on http://localhost:${PORT}`);
});
