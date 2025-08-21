import express from 'express';
import cors from 'cors';
import pino from 'pino';

import healthRouter from './routes/health.js';
import policiesRouter from './routes/policies.js';
import exportRouter from './routes/export.js';

const app = express();
const logger = pino({ name: 'server' });

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'request');
  next();
});

app.use('/health', healthRouter);

// ✅ Mount export routes at /api  → final path: /api/policies/:id/export
app.use('/api/policies  ', exportRouter);

// Your other policy CRUD under /api/policies
app.use('/api/policies', policiesRouter);

// Optional: explicit 404 to see what path missed
app.use((req, res) => res.status(404).json({ error: 'Not Found', path: req.originalUrl }));

app.use((err, _req, res, _next) => {
  logger.error({ err }, 'unhandled');
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
