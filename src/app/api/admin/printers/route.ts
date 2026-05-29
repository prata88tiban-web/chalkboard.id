import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { printers } from '@/schema/settings';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allPrinters = await db.select().from(printers).where(eq(printers.isActive, true));
    return NextResponse.json(allPrinters);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch printers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, type, address, location } = await request.json();

    if (!name || !type || !address || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (id) {
      // Update existing
      const updated = await db.update(printers)
        .set({ name, type, address, location, updatedAt: new Date() })
        .where(eq(printers.id, id))
        .returning();
      return NextResponse.json(updated[0]);
    } else {
      // Create new
      const inserted = await db.insert(printers).values({
        name,
        type,
        address,
        location,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return NextResponse.json(inserted[0]);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save printer' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await db.update(printers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(printers.id, parseInt(id)));

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete printer' }, { status: 500 });
  }
}
