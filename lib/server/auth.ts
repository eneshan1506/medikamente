import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

const cookieOptions = (): Partial<ResponseCookie> => {
  const sameSite = (process.env.COOKIE_SAME_SITE ?? 'lax') as 'lax' | 'strict' | 'none';
  const secure = (process.env.COOKIE_SECURE ?? (process.env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true';
  const domain = process.env.COOKIE_DOMAIN;
  return { httpOnly: true, sameSite, secure, domain: domain || undefined, path: '/' };
};

export const signSession = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');
  return jwt.sign({ userId }, secret, { expiresIn: '7d' });
};

export const setSessionCookie = (token: string): void => {
  cookies().set('session', token, cookieOptions());
};

export const clearSessionCookie = (): void => {
  cookies().set('session', '', { ...cookieOptions(), maxAge: 0 });
};

export const getUserIdFromSession = (): string | null => {
  const token = cookies().get('session')?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;
  try {
    const payload = jwt.verify(token, secret) as { userId: string };
    return payload.userId;
  } catch {
    return null;
  }
};
