import { dbConnect } from "../../../server/src/lib/db.js";
import { updateBlocks } from "../../../server/src/controllers/policy.controller.js";

export default async function handler(req, res) {
  if (!["PUT","POST"].includes(req.method)) return res.status(405).end();
  await dbConnect();
  return updateBlocks(req, res);
}
