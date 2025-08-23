import { dbConnect } from "../../../server/src/lib/db.js";
import { exportPolicy } from "../../../server/src/controllers/exportController.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();
  await dbConnect();
  return exportPolicy(req, res);
}
