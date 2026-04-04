import { Router, Request, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth.middleware';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const StripeLib = require('stripe');

const router = Router();

// Stripe is optional — only initialise if key is present
const stripe = env.stripeSecretKey
  ? new StripeLib(env.stripeSecretKey, { apiVersion: '2025-03-31.basil' })
  : null;

// ── POST /billing/create-checkout ────────────────────────────
router.post('/create-checkout', protect, async (req: Request, res: Response) => {
  if (!stripe || !env.stripePriceIdPro) {
    res.status(503).json({ message: 'Billing not configured' });
    return;
  }
  const userId = (req as AuthRequest).userId!;
  const user   = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) { res.status(404).json({ message: 'User not found' }); return; }

  try {
    const session = await stripe.checkout.sessions.create({
      mode:               'subscription',
      payment_method_types: ['card'],
      customer_email:     user.email,
      line_items: [{ price: env.stripePriceIdPro, quantity: 1 }],
      success_url: `${env.clientUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${env.clientUrl}/billing`,
      metadata:    { userId },
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('[Billing] checkout error:', err);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

// ── POST /billing/webhook ─────────────────────────────────────
router.post('/webhook', async (req: Request, res: Response) => {
  if (!stripe || !env.stripeWebhookSecret) {
    res.status(503).json({ message: 'Webhook not configured' });
    return;
  }
  const sig = req.headers['stripe-signature'] as string;
  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.stripeWebhookSecret);
  } catch {
    res.status(400).json({ message: 'Webhook signature invalid' });
    return;
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as { metadata?: { userId?: string } };
    const userId  = session.metadata?.userId;
    if (userId) {
      console.log(`[Billing] Pro subscription activated for user ${userId}`);
    }
  }

  res.json({ received: true });
});

// ── GET /billing/status ───────────────────────────────────────
router.get('/status', protect, async (_req: Request, res: Response) => {
  res.json({ plan: 'FREE', features: ['tasks', 'timer', 'ai_goals', 'documents'] });
});

export default router;
