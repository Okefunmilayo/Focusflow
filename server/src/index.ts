import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cron from 'node-cron';

import { env } from './config/env';
import { errorHandler, notFound } from './middleware/error.middleware';
import { generalLimiter } from './middleware/rateLimit.middleware';

import authRoutes      from './routes/auth.routes';
import tasksRoutes     from './routes/tasks.routes';
import aiRoutes        from './routes/ai.routes';
import pomodoroRoutes  from './routes/pomodoro.routes';
import analyticsRoutes from './routes/analytics.routes';
import documentsRoutes from './routes/documents.routes';
import digestRoutes    from './routes/digest.routes';
import billingRoutes       from './routes/billing.routes';
import passwordResetRoutes from './routes/passwordReset.routes';
import { runWeeklyDigestForAllUsers } from './services/digest.service';
import { prisma } from './config/prisma';

const app = express();

// ── Security & Parsing ────────────────────────────────────
app.use(helmet());
// Allow localhost on any port in dev (Vite picks 5173/5174/etc depending on what's free)
const allowedOrigins = env.isDev()
  ? /^http:\/\/(localhost|\d+\.\d+\.\d+\.\d+):\d+$/
  : env.clientUrl;
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.isDev() ? 'dev' : 'combined'));
app.use(generalLimiter);

// ── Health Check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', app: 'FocusFlow API', version: '1.0.0' });
});

// ── API Routes ────────────────────────────────────────────
app.use('/api/v1/auth',      authRoutes);
app.use('/api/v1/tasks',     tasksRoutes);
app.use('/api/v1/ai',        aiRoutes);
app.use('/api/v1/pomodoro',  pomodoroRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/documents', documentsRoutes);
app.use('/api/v1/digest',    digestRoutes);
app.use('/api/v1/billing',   billingRoutes);
app.use('/api/v1/auth',      passwordResetRoutes);

// ── Weekly AI Digest Cron — Every Sunday at 8:00 PM ──────
cron.schedule('0 20 * * 0', async () => {
  console.log('[CRON] Running weekly AI digest job...');
  await runWeeklyDigestForAllUsers();
  console.log('[CRON] Weekly digest complete.');
});

// ── Error Handling ────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────
async function start() {
  await prisma.$queryRaw`SELECT 1`;
  app.listen(env.port, () => {
    console.log(`
  ╔════════════════════════════════════════╗
  ║   FocusFlow API — Running             ║
  ║   Port    : ${env.port}                     ║
  ║   Env     : ${env.nodeEnv}              ║
  ║   AI      : Anthropic Claude API      ║
  ╚════════════════════════════════════════╝
    `);
  });
}

start().catch((err) => {
  console.error('[Startup] Failed to connect to database:', err.message);
  process.exit(1);
});

export default app;
