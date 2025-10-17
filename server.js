const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/crowdsense";

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log("MongoDB 연결 성공");
})
.catch((error) => {
  console.error("MongoDB 연결 실패:", error);
  process.exit(1);
});

// 미들웨어
app.use(cors());
app.use(express.json());

// 라우트 연결
const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);

const crowdRoutes = require("./src/routes/crowdRoutes");
app.use("/api/crowds", crowdRoutes);

const trafficRoutes = require("./src/routes/trafficRoutes");
app.use("/api/traffic", trafficRoutes);

const parkingRoutes = require("./src/routes/parkingRoutes");
app.use("/api/parking", parkingRoutes);

const testRoutes = require("./src/routes/testRoutes");
app.use("/api/test", testRoutes);

// 기본 경로
app.get("/", (req, res) => {
  res.send("CrowdSense 서버 작동중! 🚀");
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
});
