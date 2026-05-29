import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { loginSchema, registerSchema, timezoneSchema } from '../domain/contracts';
import { prisma } from '../infrastructure/prisma';
import { requireAuth, type AuthRequest } from '../middleware/auth';

export const authRouter = Router();

const sign = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

authRouter.post('/register', async (req, res) => {
  const input = registerSchema.parse(req.body);
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) return res.status(409).json({ error: 'Email already in use' });

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, timeZone: 'Europe/Berlin' }
  });

  res.cookie('session', sign(user.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return res.json({ id: user.id, email: user.email, timeZone: user.timeZone });
});

authRouter.post('/login', async (req, res) => {
  const input = loginSchema.parse(req.body);
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  res.cookie('session', sign(user.id), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return res.json({ id: user.id, email: user.email, timeZone: user.timeZone });
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie('session');
  return res.status(204).send();
});

authRouter.get('/me', requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId! }, select: { id: true, email: true, timeZone: true } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json(user);
});

authRouter.post('/timezone', requireAuth, async (req: AuthRequest, res) => {
  const input = timezoneSchema.parse(req.body);
  const user = await prisma.user.update({ where: { id: req.userId! }, data: { timeZone: input.timeZone }, select: { id: true, email: true, timeZone: true } });
  return res.json(user);
});
