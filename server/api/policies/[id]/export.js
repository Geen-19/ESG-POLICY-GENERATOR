// server/api/policies/[id]/export.js
import { dbConnect } from "../../../src/lib/db.js";
import { exportPolicy } from "../../../src/controllers/exportController.js";
import { withCors } from "../../_cors.js";
export default withCors(async (req, res) => {
  if (req.method !== "GET") return res.status(405).end();
  await dbConnect();
  return exportPolicy(req, res);
});
