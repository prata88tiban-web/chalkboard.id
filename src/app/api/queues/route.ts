import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queues } from '@/schema/queues';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activeQueue = await db.select()
      .from(queues)
      .where(eq(queues.status, 'waiting'))
      .orderBy(queues.createdAt);
    return NextResponse.json(activeQueue);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to fetch queue' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const [newQueue] = await db.insert(queues).values(data).returning();
    return NextResponse.json(newQueue);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to add to queue' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, status } = await request.json();
    const [updatedQueue] = await db.update(queues)
      .set({ status, updatedAt: new Date() })
      .where(eq(queues.id, id))
      .returning();
    return NextResponse.json(updatedQueue);
  } catch (error) {
    return NextResponse.json({ message: 'Failed to update queue' }, { status: 500 });
  }
}
