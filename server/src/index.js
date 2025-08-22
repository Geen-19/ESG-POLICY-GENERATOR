import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import logger from "./lib/logger.js";
import policyRoutes from "./routes/policies.js";
import errorHandler from "./middleware/error.js";
import healthRoutes from "./routes/health.js"
//import exportRoutes from "./routes/export.js"; // Import export routes
const app = express();
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, "request");
  next();
}
);
app.use("/health", healthRoutes)
app.use("/api/policies", policyRoutes);
app.use((req, res) => res.status(404).json({ error: 'Not Found', path: req.originalUrl }));

app.use((err, _req, res, _next) => {
  logger.error({ err }, 'unhandled');
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

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
