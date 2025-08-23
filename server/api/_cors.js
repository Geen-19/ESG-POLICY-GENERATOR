// server/api/_cors.js
const allowList = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const allowPreviews = process.env.ALLOW_VERCEL_PREVIEWS === "1";

function isAllowed(origin) {
  return true; // Temporarily allow all origins
}

export function withCors(handler) {
  return async (req, res) => {
    const origin = req.headers.origin;
    const ok = isAllowed(origin);

    // Always set these before doing anything else
    if (ok) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    // res.setHeader("Access-Control-Allow-Credentials", "true"); // only if you use cookies

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    try {
      await handler(req, res);
    } catch (err) {
      console.error("API error:", err);
      // Ensure the CORS headers we set above remain on this error response
      if (!res.headersSent) {
        res.status(500).json({ error: "Internal error" });
      }
    }
  };
}
