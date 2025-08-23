import { dbConnect } from "../../../src/lib/db.js";
import { updateBlocks } from "../../../src/controllers/policy.controller.js";
import { withCors } from "../../_cors.js";

async function handler(req, res, next) {
  if (!["PUT","POST"].includes(req.method)) return res.status(405).end();
  await dbConnect();
  return updateBlocks(req, res, next);
}

export default withCors(handler);