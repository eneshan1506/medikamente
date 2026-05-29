import { NextResponse } from 'next/server';
import { clearSessionCookie } from '../../../../lib/server/auth';

export async function POST() {
  clearSessionCookie();
  return new NextResponse(null, { status: 204 });
}
