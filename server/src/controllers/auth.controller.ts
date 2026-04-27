import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { sendWelcomeEmail } from '../services/email.service';

const signAccessToken  = (userId: string, email: string) =>
  jwt.sign({ userId, email }, env.jwtSecret, { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] });

const signRefreshToken = (userId: string) =>
  jwt.sign({ userId }, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'] });

// ── Validation rules ──────────────────────────────────────
export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name too long'),
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

export const loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

// ── Register ──────────────────────────────────────────────
export const register = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ message: errors.array()[0].msg });
    return;
  }
  try {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: 'An account with this email already exists' });
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    const user   = await prisma.user.create({
      data: { id: uuidv4(), name, email, password: hashed },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    const accessToken  = signAccessToken(user.id, user.email);
    const refreshToken = signRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: { id: uuidv4(), token: refreshToken, userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    // Send welcome email (non-blocking — don't fail registration if email fails)
    sendWelcomeEmail(user.email, user.name).catch((e) =>
      console.error('[Email] Welcome email failed:', e.message)
    );

    res.status(201).json({ success: true, message: 'Account created successfully', user, accessToken, refreshToken });
  } catch {
    res.status(500).json({ message: 'Registration failed' });
  }
};

// ── Login ─────────────────────────────────────────────────
export const login = async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(422).json({ message: errors.array()[0].msg });
    return;
  }
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const accessToken  = signAccessToken(user.id, user.email);
    const refreshToken = signRefreshToken(user.id);

    // Invalidate old refresh tokens for this user (session rotation)
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.refreshToken.create({
      data: { id: uuidv4(), token: refreshToken, userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.json({ success: true, message: 'Login successful',
      user: { id: user.id, name: user.name, email: user.email }, accessToken, refreshToken });
  } catch {
    res.status(500).json({ message: 'Login failed' });
  }
};

// ── Refresh Token ─────────────────────────────────────────
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) { res.status(401).json({ message: 'Refresh token required' }); return; }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const decoded = jwt.verify(refreshToken, env.jwtRefreshSecret) as { userId: string };
    const user    = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) { res.status(401).json({ message: 'User not found' }); return; }

    // Rotate — issue new refresh token, invalidate old one
    const newAccessToken  = signAccessToken(user.id, user.email);
    const newRefreshToken = signRefreshToken(user.id);

    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    await prisma.refreshToken.create({
      data: { id: uuidv4(), token: newRefreshToken, userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });

    res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// ── Logout ────────────────────────────────────────────────
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch {
    res.status(500).json({ message: 'Logout failed' });
  }
};

// ── Get Me ────────────────────────────────────────────────
export const getMe = async (req: Request & { userId?: string }, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.userId },
      select: { id: true, name: true, email: true, avatar: true, plan: true, createdAt: true },
    });
    if (!user) { res.status(404).json({ message: 'User not found' }); return; }
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};
