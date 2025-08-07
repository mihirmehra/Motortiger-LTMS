import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Team from '@/models/Team';
import { authenticateUser } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    let query = {};
    
    // Managers can only see teams they manage
    if (user.role === 'manager') {
      query = { manager: user._id };
    }
    // Admins can see all teams (no filter)

    const totalTeams = await Team.countDocuments(query);
    const activeTeams = await Team.countDocuments({ ...query, isActive: true });
    
    // Calculate total members across all teams
    const teams = await Team.find(query);
    const totalMembers = teams.reduce((sum, team) => sum + team.members.length, 0);

    const stats = {
      totalTeams,
      activeTeams,
      totalMembers
    };

    return NextResponse.json(stats);
  } catch (error:any) {
    console.error('Error fetching team stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}