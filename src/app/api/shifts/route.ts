import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { shifts } from '@/schema/shifts';
import { eq, and, isNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allShifts = await db.select().from(shifts).orderBy(shifts.startTime);
    return NextResponse.json(allShifts);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch shifts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { staffId, startBalance } = await request.json();

    // Check if there's an active shift
    const activeShift = await db.select()
      .from(shifts)
      .where(and(eq(shifts.staffId, staffId), eq(shifts.status, 'open')));

    if (activeShift.length > 0) {
      return NextResponse.json({ message: 'Staff already has an open shift' }, { status: 400 });
    }

    const [newShift] = await db.insert(shifts).values({
      staffId,
      startBalance: startBalance.toString(),
      status: 'open',
    }).returning();

    return NextResponse.json(newShift);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to open shift' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, endBalance, actualCash, notes } = await request.json();

    const [updatedShift] = await db.update(shifts)
      .set({
        endBalance: endBalance.toString(),
        actualCash: actualCash.toString(),
        notes,
        status: 'closed',
        endTime: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(shifts.id, id))
      .returning();

    return NextResponse.json(updatedShift);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to close shift' }, { status: 500 });
  }
}
