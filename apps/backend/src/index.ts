import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import routes from "./routes";
import { logger } from "./utils/logger";
import { startDepositMonitor } from "./crypto/deposit-monitor/monitor";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(helmet());
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:4173",
  process.env.WEB_URL,
  process.env.ADMIN_URL,
].filter(Boolean) as string[];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// Main aggregated routing tree
app.use(routes);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "globalpay-backend" });
});

// Start background blockchain monitor
startDepositMonitor();

const server = app.listen(PORT, () => {
  logger.info(`🚀 Backend service running on port ${PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    logger.error(`Port ${PORT} is already in use. Kill the process and retry.`);
    process.exit(1);
  } else {
    throw err;
  }
});
