import { dbConnect } from "../../src/lib/db.js";
import { generatePolicy } from "../../src/controllers/policy.controller.js";
import { withCors } from "../_cors.js";

async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  await dbConnect();
  return generatePolicy(req, res);
}
export default withCors(handler);