const authRouter = require("express").Router();
const jwt = require("jsonwebtoken");

// 고정된 시크릿 키
const SECRET = "supersecret";

//실습용 사용자 목록 (메모리 기반, DB 없음)
const users = [];

//초기 관리자 계정 삽입 (name 포함)
users.push({
  email: "admin@test.com",
  password: "admin123",
  name: "Administrator",
  role: "admin",
});

//회원가입 API
authRouter.post("/signup", (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "이메일과 비밀번호를 입력하세요" });
  }

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
  const { email, password } = req.body;

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
