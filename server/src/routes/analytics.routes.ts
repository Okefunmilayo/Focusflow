import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';

const router = Router();
router.use(protect);

router.get('/dashboard', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;
    const now    = new Date();
    const weekAgo = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalTasks,
      completedThisWeek,
      totalFocusMinutes,
      categoryBreakdown,
      recentSessions,
    ] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'DONE', updatedAt: { gte: weekAgo } } }),
      prisma.pomodoroSession.aggregate({
        where: { userId, completed: true, createdAt: { gte: monthAgo } },
        _sum:  { duration: true },
      }),
      prisma.task.groupBy({
        by:    ['category'],
        where: { userId },
        _count: { category: true },
      }),
      prisma.pomodoroSession.findMany({
        where:   { userId, completed: true, createdAt: { gte: weekAgo } },
        orderBy: { createdAt: 'asc' },
        select:  { createdAt: true, duration: true },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        totalTasks,
        completedThisWeek,
        focusHoursThisMonth: Math.round((totalFocusMinutes._sum.duration ?? 0) / 60 * 10) / 10,
        categoryBreakdown:   categoryBreakdown.map((c) => ({
          category: c.category,
          count:    c._count.category,
        })),
        dailyFocus: recentSessions,
      },
    });
  } catch {
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
});

export default router;
