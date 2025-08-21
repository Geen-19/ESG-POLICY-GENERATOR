// routes/policies.js
import { Router } from 'express';
import { z } from 'zod';
import { GenerateBody, UpdateBlocksBody, ExportBody } from '../validators/policies.schema.js';
import { updateBlocks } from '../controllers/policy.controller.js';
import { generatePolicy } from '../../../web/src/lib/api.js';
import { getPolicyById } from '../controllers/policy.controller.js';
import { exportPolicy } from '../controllers/exportController.js'; // Adjust import path if needed
const r = Router();

const parse = (schema) => (req, _res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (e) {
    e.status = 400;
    next(e);
  }
};

r.post('/generate', parse(GenerateBody), generatePolicy);
r.get('/:id', getPolicyById);
r.put('/:id/blocks', parse(UpdateBlocksBody), updateBlocks);

// NEW: allow GET for browser downloads: /api/policies/:id/export?format=pdf|docx
r.get('/:id/export', exportPolicy);

// Keep POST if you also want JSON body { format }
r.post('/:id/export', parse(ExportBody), exportPolicy);

export default r;
