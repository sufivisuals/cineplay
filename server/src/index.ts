import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { assetRouter } from './routes/assetRoutes';
import { commentRouter } from './routes/commentRoutes';
import { nleRouter } from './routes/nleRoutes';
import { initSocketHub } from './realtime/socketHub';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true }));

// Healthcheck endpoint
app.get('/health', (_req, res) => {
  res.json({
    status: 'healthy',
    service: 'CinePlay Pro Backend API & Media Pipeline',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/v1/assets', assetRouter);
app.use('/api/v1/comments', commentRouter);
app.use('/api/v1/nle', nleRouter);

const server = http.createServer(app);
initSocketHub(server);

server.listen(PORT, () => {
  console.log(`🚀 CinePlay Pro API & WebSocket Hub running on port ${PORT}`);
  console.log(`📹 S3 Endpoint: ${process.env.S3_ENDPOINT || 'http://localhost:9000'}`);
});
