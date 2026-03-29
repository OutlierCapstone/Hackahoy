require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 5000;

// CORS 허용
app.use(cors());
app.use(express.json());

// 라우터 연결
const path = require("path");
const adminRoutes = require(path.join(__dirname, "routes/admin"));
const authRoutes = require(path.join(__dirname, "routes/auth")); //추가 필요

app.use("/admin", adminRoutes);
app.use("/auth", authRoutes); //프론트의 로그인 요청 대응

// 서버 시작
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
