import { dbConnect } from "../../../src/lib/db.js";
import { exportPolicy } from "../../../src/controllers/exportController.js";
import { withCors } from "../../_cors.js";

async function handler(req, res, next) {
  if (req.method !== "GET") return res.status(405).end();
  await dbConnect();
  return exportPolicy(req, res, next);
}


export default withCors(handler);