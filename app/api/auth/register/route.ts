import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/server/prisma';
import { registerSchema } from '../../../../lib/server/validation';
import { setSessionCookie, signSession } from '../../../../lib/server/auth';

export async function POST(request: Request) {
  const input = registerSchema.parse(await request.json());
  const exists = await prisma.user.findUnique({ where: { email: input.email } });
  if (exists) return NextResponse.json({ error: 'Email already in use' }, { status: 409 });

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({ data: { email: input.email, passwordHash, timeZone: 'Europe/Berlin' } });
  setSessionCookie(signSession(user.id));
  return NextResponse.json({ id: user.id, email: user.email, timeZone: user.timeZone });
}
