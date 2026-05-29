import { Router } from 'express';
import { pushSchema } from '../domain/contracts';
import { prisma } from '../infrastructure/prisma';
import { requireAuth, type AuthRequest } from '../middleware/auth';

export const pushRouter = Router();
pushRouter.use(requireAuth);

pushRouter.post('/subscribe', async (req: AuthRequest, res) => {
  const body = pushSchema.parse(req.body);
  await prisma.pushSubscription.upsert({
    where: { endpoint: body.endpoint },
    update: {
      userId: req.userId!,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: req.headers['user-agent']
    },
    create: {
      userId: req.userId!,
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      userAgent: req.headers['user-agent']
    }
  });
  return res.status(204).send();
});

pushRouter.post('/unsubscribe', async (req: AuthRequest, res) => {
  const endpoint = req.body?.endpoint as string | undefined;
  if (!endpoint) return res.status(400).json({ error: 'endpoint missing' });

  await prisma.pushSubscription.deleteMany({ where: { userId: req.userId!, endpoint } });
  return res.status(204).send();
});
