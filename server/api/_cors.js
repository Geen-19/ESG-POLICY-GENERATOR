// server/api/_cors.js
export function withCors(handler) {
  const origin = process.env.VITE_API_BASE || "*";
  return async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
    if (req.method === "OPTIONS") return res.status(204).end();
    return handler(req, res);
  };
}
