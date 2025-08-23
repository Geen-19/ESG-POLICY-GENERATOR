import { dbConnect } from "../../server/src/lib/db.js";

import { getPolicyById } from "../../server/src/controllers/policy.controller.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  await dbConnect();
  return getPolicy(req, res);
}
