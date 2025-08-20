import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import app from './app.js';
import { connectDB } from './mongo.js';

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();
  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

start().catch((e) => {
  console.error('Fatal boot error:', e);
  process.exit(1);
});
