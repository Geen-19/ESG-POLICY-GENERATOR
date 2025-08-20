import express from 'express';
import cors from 'cors';
import pino from 'pino';

import healthRouter from './routes/health.js';
import policiesRouter from './routes/policies.js';

const app = express();
const logger = pino({ name: 'server' });

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// tiny request logger
app.use((req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'request');
  next();
});

app.use('/health', healthRouter);
app.use('/api/policies', policiesRouter);

app.use((err, _req, res, _next) => {
  logger.error({ err }, 'unhandled');
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
