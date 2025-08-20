import pino from "pino";

// Enable pretty logs only if PRETTY_LOGS=1 and not production
const wantPretty = process.env.PRETTY_LOGS === "1" && process.env.NODE_ENV !== "production";

let transport = undefined;
if (wantPretty) {
  try {
    // Try to dynamically import pino-pretty; if missing, fall back silently
    await import("pino-pretty");
    transport = {
      target: "pino-pretty",
      options: {
        translateTime: "SYS:standard",
        singleLine: false
      }
    };
  } catch {
    // eslint-disable-next-line no-console
    console.warn("pino-pretty not installed; falling back to JSON logs.");
  }
}

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  ...(transport ? { transport } : {})
});

export default logger;
