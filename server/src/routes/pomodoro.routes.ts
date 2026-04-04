import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(protect);

// ── Log a completed session ───────────────────────────────
router.post('/sessions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { duration, type, taskId, completed } = req.body;

    const session = await prisma.pomodoroSession.create({
      data: {
        id: uuidv4(),
        duration:  duration ?? 25,
        type:      type     ?? 'WORK',
        completed: completed ?? true,
        userId:    req.userId!,
        taskId:    taskId ?? null,
      },
    });

    res.status(201).json({ success: true, session });
  } catch {
    res.status(500).json({ message: 'Failed to log session' });
  }
});

// ── Get sessions (with streak calc) ──────────────────────
router.get('/sessions', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const sessions = await prisma.pomodoroSession.findMany({
      where:   { userId: req.userId, completed: true },
      orderBy: { createdAt: 'desc' },
      take:    100,
    });

    // Calculate current streak
    const today   = new Date();
    today.setHours(0, 0, 0, 0);
    let streak    = 0;
    let checkDate = new Date(today);

    while (true) {
      const hasSession = sessions.some((s) => {
        const d = new Date(s.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === checkDate.getTime();
      });
      if (!hasSession) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    res.json({ success: true, sessions, streak });
  } catch {
    res.status(500).json({ message: 'Failed to fetch sessions' });
  }
});

export default router;
