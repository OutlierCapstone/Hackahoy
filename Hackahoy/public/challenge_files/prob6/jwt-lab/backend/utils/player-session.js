const { createHash, randomUUID } = require("crypto");

const SESSION_COOKIE = "prob6-player";
const FALLBACK_SESSION_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

// cookie-parser 를 새로 넣지 않고 Cookie 헤더만 직접 읽는다.
// 쓰기는 express 기본 res.cookie() 로 처리한다.
function readCookie(req, name) {
  const header = req.headers && req.headers.cookie;
  if (!header) return undefined;

  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      return part.slice(index + 1).trim();
    }
  }
  return undefined;
}

function hashIdentity(identity) {
  return createHash("sha256").update(identity).digest("hex");
}

// 플랫폼 uid 쿠키가 있으면 그것으로, 없으면(챌린지에 직접 접속한 경우)
// 24시간짜리 fallback 쿠키를 새로 발급해 플레이어를 구분한다.
function getPlayerSession(req) {
  const platformUid = (readCookie(req, "uid") || "").trim();
  if (platformUid) {
    return { key: hashIdentity(`platform:${platformUid}`) };
  }

  const existingSession = readCookie(req, SESSION_COOKIE);
  if (existingSession && FALLBACK_SESSION_PATTERN.test(existingSession)) {
    return { key: hashIdentity(`fallback:${existingSession}`) };
  }

  const newCookie = randomUUID();
  return { key: hashIdentity(`fallback:${newCookie}`), newCookie };
}

function applyPlayerCookie(res, session) {
  if (!session.newCookie) return;

  res.cookie(SESSION_COOKIE, session.newCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 24 * 60 * 60 * 1000,
  });
}

module.exports = { getPlayerSession, applyPlayerCookie, SESSION_COOKIE };
