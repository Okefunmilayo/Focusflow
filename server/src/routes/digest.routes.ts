import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import { generateDigestForUser } from '../services/digest.service';

const router = Router();
router.use(protect);

// GET /digest — list past digests for the user
router.get('/', async (req, res: Response) => {
  const userId = (req as AuthRequest).userId!;
  try {
    const digests = await prisma.weeklyDigest.findMany({
      where:   { userId },
      orderBy: { weekStart: 'desc' },
      take:    10,
    });
    res.json({ digests });
  } catch {
    res.status(500).json({ message: 'Failed to fetch digests' });
  }
});

// POST /digest/generate — manually trigger digest for current user
router.post('/generate', async (req, res: Response) => {
  const userId = (req as AuthRequest).userId!;
  try {
    await generateDigestForUser(userId);
    const latest = await prisma.weeklyDigest.findFirst({
      where:   { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ digest: latest });
  } catch (err) {
    console.error('[Digest] generate error:', err);
    res.status(500).json({ message: 'Failed to generate digest' });
  }
});

export default router;
