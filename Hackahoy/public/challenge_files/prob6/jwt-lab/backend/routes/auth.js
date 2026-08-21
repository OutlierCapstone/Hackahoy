const authRouter = require("express").Router();
const jwt = require("jsonwebtoken");
const { getPlayerSession, applyPlayerCookie } = require("../utils/player-session");

// 고정된 시크릿 키
const SECRET = "supersecret";

// 실습용 사용자 목록을 플레이어별로 분리한다(메모리 기반, DB 없음).
// 이전에는 모듈 전역 배열 하나를 모든 참가자가 공유해서, 한 참가자가 어떤 이메일로
// 가입하면 다른 참가자는 같은 이메일로 가입할 수 없었고 남의 계정으로 로그인까지 됐다.
//
// /admin 의 무서명 jwt.decode() 취약점은 이 파일과 무관하며 그대로 유지된다.
const MAX_PLAYER_STATES = 5000;
const playerUsers = new Map();

// 초기 관리자 계정은 플레이어마다 동일하게 seed 한다.
function createInitialUsers() {
  return [
    {
      email: "admin@test.com",
      password: "admin123",
      name: "Administrator",
      role: "admin",
    },
  ];
}

function getUsers(playerKey) {
  const existing = playerUsers.get(playerKey);
  if (existing) return existing;

  const users = createInitialUsers();
  playerUsers.set(playerKey, users);

  if (playerUsers.size > MAX_PLAYER_STATES) {
    const oldestKey = playerUsers.keys().next().value;
    if (oldestKey !== undefined) playerUsers.delete(oldestKey);
  }

  return users;
}

//회원가입 API
authRouter.post("/signup", (req, res) => {
  const session = getPlayerSession(req);
  applyPlayerCookie(res, session);

  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력하세요" });
  }

  const users = getUsers(session.key);

  const exists = users.find((u) => u.email === email);
  if (exists) {
    return res.status(409).json({ error: "이미 존재하는 이메일입니다" });
  }

  users.push({
    email,
    password,
    name: name || email.split("@")[0], // 이름이 없으면 이메일 앞부분 사용
    role: "user",
  });

  return res.json({ message: "회원가입 성공! 로그인해주세요." });
});

//로그인 API
authRouter.post("/login", (req, res) => {
  const session = getPlayerSession(req);
  applyPlayerCookie(res, session);

  const { email, password } = req.body;

  const users = getUsers(session.key);
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "이메일 또는 비밀번호가 틀렸습니다" });
  }

  //name 포함하여 JWT 발급
  const token = jwt.sign(
    {
      email: user.email,
      name: user.name,
      role: user.role,
    },
    SECRET,
    {
      algorithm: "HS256",
      expiresIn: "1h",
    }
  );

  return res.json({ token });
});

module.exports = authRouter;
