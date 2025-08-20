import { Router } from 'express';
const r = Router();

r.get('/', (_req, res) => res.status(200).json({ status: 'ok' }));

export default r;
