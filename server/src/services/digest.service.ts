import { prisma } from '../config/prisma';
import { generateWeeklyDigest } from './ai/claude.service';

export async function runWeeklyDigestForAllUsers(): Promise<void> {
  const users = await prisma.user.findMany({ select: { id: true } });

  for (const user of users) {
    try {
      await generateDigestForUser(user.id);
    } catch (err) {
      console.error(`[Digest] Failed for user ${user.id}:`, err);
    }
  }
}

export async function generateDigestForUser(userId: string): Promise<void> {
  const now       = new Date();
  const weekEnd   = new Date(now);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  // Gather data
  const [tasks, sessions] = await Promise.all([
    prisma.task.findMany({
      where: {
        userId,
        updatedAt: { gte: weekStart },
      },
    }),
    prisma.pomodoroSession.findMany({
      where: {
        userId,
        completed: true,
        createdAt: { gte: weekStart },
      },
    }),
  ]);

  const completedTasks = tasks.filter((t) => t.status === 'DONE');
  const focusHours     = sessions.reduce((sum, s) => sum + s.duration, 0) / 60;

  const categoryMap: Record<string, number> = {};
  tasks.forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] ?? 0) + 1;
  });
  const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const pendingTasks = tasks
    .filter((t) => t.status !== 'DONE')
    .map((t) => t.title)
    .slice(0, 10);

  const result = await generateWeeklyDigest({
    tasksCompleted: completedTasks.length,
    totalTasks:     tasks.length,
    focusHours:     Math.round(focusHours * 10) / 10,
    topCategory:    topCategory ?? undefined,
    pendingTasks,
  });

  await prisma.weeklyDigest.create({
    data: {
      userId,
      weekStart,
      weekEnd,
      tasksCompleted:  completedTasks.length,
      focusHours:      Math.round(focusHours * 10) / 10,
      topCategory:     topCategory ?? undefined,
      aiSummary:       result.summary,
      improvements:    result.improvements,
      recommendations: result.recommendations,
    },
  });
}
