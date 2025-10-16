const express = require("express");
const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.send("CrowdSense 서버 작동중! 🚀");
});

app.listen(PORT, () => {
  console.log(`서버 실행: http://localhost:${PORT}`);
});
