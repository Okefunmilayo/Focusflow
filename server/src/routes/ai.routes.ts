import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth.middleware';
import { aiLimiter } from '../middleware/rateLimit.middleware';
import { breakdownGoal, suggestTaskBreakdown } from '../services/ai/claude.service';
import { prisma } from '../config/prisma';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
router.use(protect);

// ── AI Goal Breakdown ─────────────────────────────────────
router.post('/goal-breakdown', aiLimiter, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { goal, deadline, context, autoCreateTasks } = req.body;

    if (!goal) { res.status(400).json({ message: 'Goal is required' }); return; }

    const steps = await breakdownGoal(goal, deadline, context);

    // Auto-create tasks if requested
    if (autoCreateTasks && steps.length > 0) {
      const taskData = steps.flatMap((step) =>
        step.dailyTasks.map((title) => ({
          id:           uuidv4(),
          title,
          description:  `${step.phase} — ${step.week}`,
          userId:       req.userId!,
          aiGenerated:  true,
          category:     'PERSONAL' as const,
        }))
      );
      await prisma.task.createMany({ data: taskData });
    }

    res.json({ success: true, steps });
  } catch {
    res.status(500).json({ message: 'AI goal breakdown failed' });
  }
});

// ── Subtask Suggestions ───────────────────────────────────
router.post('/suggest-subtasks', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskTitle } = req.body;
    if (!taskTitle) { res.status(400).json({ message: 'taskTitle is required' }); return; }

    const subtasks = await suggestTaskBreakdown(taskTitle);
    res.json({ success: true, subtasks });
  } catch {
    res.status(500).json({ message: 'Subtask suggestion failed' });
  }
});

export default router;
