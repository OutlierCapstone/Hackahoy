const jwt = require("jsonwebtoken");

const SECRET = "supersecret";

// JWT 토큰 생성
function generateToken(payload) {
  return jwt.sign(payload, SECRET, { algorithm: "HS256", expiresIn: "1h" });
}

// 검증 생략된 토큰 디코딩 (취약점용)
function decodeTokenWithoutVerify(token) {
  return jwt.decode(token); // 검증 없이 내용만 디코드
}

// 정식 검증 함수 (실제 서비스에서는 이걸 사용해야 안전)
function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = {
  generateToken,
  decodeTokenWithoutVerify,
  verifyToken, // 사용하진 않지만 참고용으로 함께 노출
};
