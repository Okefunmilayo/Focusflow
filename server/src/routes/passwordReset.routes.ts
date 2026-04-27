import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/prisma';

const router = Router();

// POST /auth/forgot-password
router.post('/forgot-password',
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(422).json({ message: errors.array()[0].msg }); return; }

    const { email } = req.body;
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      // Always respond the same way — don't reveal if email exists
      if (!user) { res.json({ message: 'If an account exists, a reset link has been sent.' }); return; }

      const token   = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.user.update({
        where: { id: user.id },
        data:  { resetToken: token, resetTokenExpiry: expires },
      });

      // In production: send email with reset link
      // For development: log the link to the console
      const resetUrl = `http://localhost:5173/reset-password?token=${token}`;
      console.log(`[Password Reset] Reset link for ${email}: ${resetUrl}`);

      res.json({ message: 'If an account exists, a reset link has been sent.' });
    } catch {
      res.status(500).json({ message: 'Something went wrong' });
    }
  }
);

// POST /auth/reset-password
router.post('/reset-password',
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { res.status(422).json({ message: errors.array()[0].msg }); return; }

    const { token, password } = req.body;
    try {
      const user = await prisma.user.findFirst({
        where: {
          resetToken:       token,
          resetTokenExpiry: { gt: new Date() },
        },
      });

      if (!user) { res.status(400).json({ message: 'Invalid or expired reset token' }); return; }

      const hashed = await bcrypt.hash(password, 12);
      await prisma.user.update({
        where: { id: user.id },
        data:  { password: hashed, resetToken: null, resetTokenExpiry: null },
      });

      // Invalidate all sessions
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

      res.json({ message: 'Password updated successfully. Please log in.' });
    } catch {
      res.status(500).json({ message: 'Something went wrong' });
    }
  }
);

export default router;
