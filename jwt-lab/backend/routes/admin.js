const adminRouter = require("express").Router();
const jwt = require("jsonwebtoken");
const { getFlag } = require("../utils/final_flag"); // 플래그 가져오기

// 관리자 대시보드 API (서명 검증 생략 intentionally)
adminRouter.get("/", (req, res) => {
  const authHeader = req.headers.authorization;

  // 토큰 없으면 거부
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({ error: "토큰이 없습니다" });
  }

  const token = authHeader.split(" ")[1];

  //검증 없이 디코드 (취약점)
  const decoded = jwt.decode(token);

  if (!decoded) {
    return res.status(403).json({ error: "토큰 디코딩 실패" });
  }

  if (decoded.role !== "admin") {
    return res.status(403).json({ error: "관리자 권한이 필요합니다" });
  }

  //관리자 확인 후 플래그 반환
  return res.json({
    flag: getFlag(),
    user: {
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
    },
  });
});

module.exports = adminRouter;
