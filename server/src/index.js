import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import logger from "./lib/logger.js";
import policyRoutes from "./routes/policies.js";
import errorHandler from "./middleware/error.js";
import healthRoutes from "./routes/health.js"
const app = express();
app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes)
app.use("/api/policies", policyRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    logger.info("Connected to MongoDB");
    app.listen(PORT, () => logger.info(`API listening on http://localhost:${PORT}`));
  })
  .catch((err) => {
    logger.error({ err }, "MongoDB connection error");
    process.exit(1);
  });
