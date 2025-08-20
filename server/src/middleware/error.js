import logger from "../lib/logger.js";
import { ZodError } from "zod";

export default function errorHandler(err, req, res, next) {
  // 400 – bad input
  if (err instanceof ZodError) {
    logger.warn({ issues: err.issues }, "Validation failed");
    return res.status(400).json({ message: "Invalid request", errors: err.issues });
  }

  // 503 – Gemini down or JSON parse failure
  if (err?.code === "GEMINI_PARSE") {
    logger.error({ err }, "Gemini parse error");
    return res.status(503).json({
      message: "Our AI provider is currently unavailable. Please try again in a moment."
    });
  }

  // 500 – DB / other
  logger.error({ err }, "Unhandled server error");
  return res.status(500).json({ message: "Internal server error" });
}
