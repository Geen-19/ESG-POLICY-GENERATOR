import { Router } from 'express';
import { z } from 'zod';
import { GenerateBody, UpdateBlocksBody, ExportBody } from '../validators/policies.schema.js';
import { generatePolicy, getPolicy, updateBlocks, exportPolicy } from '../controllers/policy.controller.js';

const r = Router();

const parse =
  (schema) =>
  (req, _res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (e) {
      e.status = 400;
      next(e);
    }
  };

r.post('/generate', parse(GenerateBody), generatePolicy);
r.get('/:id', getPolicy);
r.put('/:id/blocks', parse(UpdateBlocksBody), updateBlocks);
r.post('/:id/export', parse(ExportBody), exportPolicy);

export default r;
