// server/api/policies/[id].js
import { dbConnect } from "../../src/lib/db.js";
import { getPolicyById } from "../../src/controllers/policy.controller.js";
import { withCors } from "../_cors.js";
export default withCors(async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();
  await dbConnect();
  return getPolicyById(req, res);
});
