import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reservations } from '@/schema/reservations';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allReservations = await db.select().from(reservations).orderBy(reservations.scheduledTime);
    return NextResponse.json(allReservations);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch reservations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const [newReservation] = await db.insert(reservations).values({
      ...data,
      scheduledTime: new Date(data.scheduledTime),
    }).returning();
    return NextResponse.json(newReservation);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to create reservation' }, { status: 500 });
  }
}
