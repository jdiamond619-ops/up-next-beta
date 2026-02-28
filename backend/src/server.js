const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const env = require("./config/env");

const authRoutes = require("./routes/authRoutes");
const videoRoutes = require("./routes/videoRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const leaderboardRoutes = require("./routes/leaderboardRoutes");

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientOrigin, credentials: true }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  if (status >= 500) {
    // Keep stack traces in server logs only.
    console.error(err);
  }
  res.status(status).json({ error: message });
});

app.listen(env.port, () => {
  console.log(`Up Next backend listening on port ${env.port}`);
});
