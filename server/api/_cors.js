// server/api/_cors.js
export function withCors(handler) {
  return async (req, res) => {
    const allowed = process.env.FRONTEND_ORIGIN || "*";
    // CORS headers first (so they exist even on errors/preflight)
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

    if (allowed === "*") {
      res.setHeader("Access-Control-Allow-Origin", "*");
    } else if (req.headers.origin === allowed) {
      res.setHeader("Access-Control-Allow-Origin", allowed);
      res.setHeader("Vary", "Origin");
    }

    if (req.method === "OPTIONS") return res.status(204).end();

    // Adapt Vercel req to Express expectations
    if (!req.params) req.params = {};
    Object.assign(req.params, req.query); // maps [id] -> req.params.id

    // Safe 'next' so Express controllers can call next(err)
    const next = (err) => {
      if (!err) return;
      console.error("Controller error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Internal error" });
    };

    try {
      return await handler(req, res, next);
    } catch (err) {
      return next(err);
    }
  };
}
