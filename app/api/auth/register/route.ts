import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { prisma } from '../../../../lib/server/prisma';
import { registerSchema } from '../../../../lib/server/validation';
import { setSessionCookie, signSession } from '../../../../lib/server/auth';

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    const exists = await prisma.user.findUnique({ where: { email: input.email } });
    if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({ data: { email: input.email, passwordHash, timeZone: 'Europe/Berlin' } });
    setSessionCookie(signSession(user.id));
    return NextResponse.json({ id: user.id, email: user.email, timeZone: user.timeZone });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid register payload' }, { status: 400 });
    }
    console.error('Register failed', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
