import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Target from '@/models/Target';
import { authenticateUser, checkPermission } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!checkPermission(user, 'update', 'targets')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const targetData = await request.json();
    const targetId = params.id;

    const updatedTarget = await Target.findByIdAndUpdate(
      targetId,
      targetData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    if (!updatedTarget) {
      return NextResponse.json({ message: 'Target not found' }, { status: 404 });
    }

    return NextResponse.json(updatedTarget);
  } catch (error:any) {
    console.error('Error updating target:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!checkPermission(user, 'delete', 'targets')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const targetId = params.id;
    const target = await Target.findByIdAndDelete(targetId);
    
    if (!target) {
      return NextResponse.json({ message: 'Target not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Target deleted successfully' });
  } catch (error:any) {
    console.error('Error deleting target:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}