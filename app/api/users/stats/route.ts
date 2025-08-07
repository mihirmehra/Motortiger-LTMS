import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import { authenticateUser, checkPermission } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!checkPermission(user, 'read', 'users')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    let query = {};
    
    // Managers can only see users they created (agents)
    if (user.role === 'manager') {
      query = { createdBy: user._id };
    }
    // Admins can see all users (no filter)

    const totalUsers = await User.countDocuments(query);
    const activeUsers = await User.countDocuments({ ...query, isActive: true });
    const admins = await User.countDocuments({ ...query, role: 'admin' });

    const stats = {
      totalUsers,
      activeUsers,
      admins
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}