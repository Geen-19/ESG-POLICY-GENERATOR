import { dbConnect } from "../../server/src/lib/db.js";
import { generatePolicy } from "../../server/src/controllers/policy.controller.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  await dbConnect();
  return generatePolicy(req, res);
}
