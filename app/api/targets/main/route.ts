import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Target from '@/models/Target';
import { authenticateUser } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    
    // Calculate main target from all targets
    const targets = await Target.find();
    
    const total = targets.reduce((sum, target) => sum + target.amount, 0);
    const achieved = targets.reduce((sum, target) => sum + target.achieved, 0);
    const remaining = total - achieved;
    const percentage = total > 0 ? Math.round((achieved / total) * 100) : 0;

    const mainTarget = {
      total,
      achieved,
      remaining,
      percentage
    };
    return NextResponse.json(mainTarget);
  } catch (error) {
    console.error('Error fetching main target:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}