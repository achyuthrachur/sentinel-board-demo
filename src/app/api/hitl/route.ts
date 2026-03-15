import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { resolveHITL } from '@/lib/eventEmitter';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    run_id: string;
    decision: 'approved' | 'revised';
    note?: string;
  };

  const found = resolveHITL(body.run_id, {
    decision: body.decision,
    note: body.note,
  });

  if (!found) {
    return NextResponse.json({ status: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ status: 'resumed' });
}
