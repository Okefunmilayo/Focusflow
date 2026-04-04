import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import { TaskStatus, Priority, Category } from '@prisma/client';

// ── Get All Tasks ─────────────────────────────────────────
export const getTasks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status   = req.query.status   as string | undefined;
    const priority = req.query.priority as string | undefined;
    const category = req.query.category as string | undefined;

    const tasks = await prisma.task.findMany({
      where: {
        userId:   req.userId,
        parentId: null, // top-level only
        ...(status   && { status:   status   as TaskStatus }),
        ...(priority && { priority: priority as Priority }),
        ...(category && { category: category as Category }),
      },
      include: { subtasks: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    res.json({ success: true, tasks });
  } catch {
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

// ── Create Task ───────────────────────────────────────────
export const createTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, priority, category, dueDate, parentId } = req.body;

    const task = await prisma.task.create({
      data: {
        id: uuidv4(),
        title,
        description,
        priority:  priority  ?? 'MEDIUM',
        category:  category  ?? 'PERSONAL',
        dueDate:   dueDate   ? new Date(dueDate) : null,
        parentId:  parentId  ?? null,
        userId:    req.userId!,
      },
    });

    res.status(201).json({ success: true, task });
  } catch {
    res.status(500).json({ message: 'Failed to create task' });
  }
};

// ── Update Task ───────────────────────────────────────────
export const updateTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.task.findFirst({ where: { id, userId: req.userId! } });

    if (!existing) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    const task = await prisma.task.update({
      where: { id },
      data:  { ...req.body, dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined },
    });

    res.json({ success: true, task });
  } catch {
    res.status(500).json({ message: 'Failed to update task' });
  }
};

// ── Delete Task ───────────────────────────────────────────
export const deleteTask = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const existing = await prisma.task.findFirst({ where: { id, userId: req.userId! } });

    if (!existing) {
      res.status(404).json({ message: 'Task not found' });
      return;
    }

    await prisma.task.delete({ where: { id } });
    res.json({ success: true, message: 'Task deleted' });
  } catch {
    res.status(500).json({ message: 'Failed to delete task' });
  }
};

// ── Update Task Status ────────────────────────────────────
export const updateTaskStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { status } = req.body;

    const task = await prisma.task.updateMany({
      where: { id, userId: req.userId! },
      data:  { status },
    });

    if (task.count === 0) { res.status(404).json({ message: 'Task not found' }); return; }
    res.json({ success: true, message: 'Status updated' });
  } catch {
    res.status(500).json({ message: 'Failed to update status' });
  }
};
