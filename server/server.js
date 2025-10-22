const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB 연결
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/crowdsense";

mongoose.connect(MONGODB_URI)
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

// Swagger 문서화
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "CrowdSense API Docs"
}));

// 라우트 연결
const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);

const crowdRoutes = require("./src/routes/crowdRoutes");
app.use("/api/crowds", crowdRoutes);

const subwayRoutes = require("./src/routes/subwayRoutes");
app.use("/api/subway", subwayRoutes);

const parkingRoutes = require("./src/routes/parkingRoutes");
app.use("/api/parking", parkingRoutes);

const areaRoutes = require("./src/routes/areaRoutes");
app.use("/api/areas", areaRoutes);

const rankingRoutes = require("./src/routes/rankingRoutes");
app.use("/api/rankings", rankingRoutes);

// 기본 경로
app.get("/", (req, res) => {
  res.json({
    message: "CrowdSense 서버 작동중! 🚀",
    documentation: `http://localhost:${PORT}/api-docs`,
    endpoints: {
      auth: "/api/auth",
      crowds: "/api/crowds",
      subway: "/api/subway",
      parking: "/api/parking",
      areas: "/api/areas",
      rankings: "/api/rankings"
    }
  });
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
  console.log(`📚 API 문서: http://localhost:${PORT}/api-docs`);
});
