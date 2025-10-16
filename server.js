const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 라우트 연결
const crowdRoutes = require("./src/routes/crowdRoutes");
app.use("/api/crowds", crowdRoutes);

// 기본 경로
app.get("/", (req, res) => {
  res.send("CrowdSense 서버 작동중! 🚀");
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
});
