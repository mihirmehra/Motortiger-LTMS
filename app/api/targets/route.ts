import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Target from '@/models/Target';
import { authenticateUser, checkPermission } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!checkPermission(user, 'read', 'targets')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const targets = await Target.find()
      .populate('createdBy', 'name email')
      .sort({ date: -1 });

    return NextResponse.json(targets);
  } catch (error:any) {
    console.error('Error fetching targets:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!checkPermission(user, 'create', 'targets')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const targetData = await request.json();
    
    // Check if target for this date already exists
    const existingTarget = await Target.findOne({ date: new Date(targetData.date) });
    if (existingTarget) {
      return NextResponse.json(
        { message: 'Target for this date already exists' },
        { status: 400 }
      );
    }

    const newTarget = new Target({
      ...targetData,
      createdBy: user._id
    });

    await newTarget.save();
    await newTarget.populate('createdBy', 'name email');

    return NextResponse.json(newTarget, { status: 201 });
  } catch (error:any) {
    console.error('Error creating target:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}