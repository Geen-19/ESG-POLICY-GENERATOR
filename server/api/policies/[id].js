import { dbConnect } from "../../src/lib/db.js";

import { getPolicyById } from "../../src/controllers/policy.controller.js";
import { withCors } from "../_cors.js";

async function handler(req, res, next) {
  if (req.method !== "GET") return res.status(405).end();
  await dbConnect();
  return getPolicyById(req, res, next);
}


export default withCors(handler);