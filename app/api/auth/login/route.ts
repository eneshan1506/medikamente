import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { prisma } from '../../../../lib/server/prisma';
import { loginSchema } from '../../../../lib/server/validation';
import { setSessionCookie, signSession } from '../../../../lib/server/auth';

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

    setSessionCookie(signSession(user.id));
    return NextResponse.json({ id: user.id, email: user.email, timeZone: user.timeZone });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid login payload' }, { status: 400 });
    }
    console.error('Login failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
