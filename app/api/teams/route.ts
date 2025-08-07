import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import { authenticateUser, checkPermission } from '@/lib/utils/auth';

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

    const teams = await Team.find(query)
      .populate('manager', 'name email')
      .populate('members', 'name email role')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json(teams);
  } catch (error:any) {
    console.error('Error fetching teams:', error);
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

  if (!['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const teamData = await request.json();
    
    // Check if team name already exists
    const existingTeam = await Team.findOne({ name: teamData.name });
    if (existingTeam) {
      return NextResponse.json(
        { message: 'Team with this name already exists' },
        { status: 400 }
      );
    }

    // Create new team
    const newTeam = new Team({
      name: teamData.name,
      description: teamData.description,
      manager: teamData.manager || user._id,
      members: teamData.members || [],
      createdBy: user._id
    });

    await newTeam.save();
    
    // Populate the team data
    await newTeam.populate('manager', 'name email');
    await newTeam.populate('members', 'name email role');
    await newTeam.populate('createdBy', 'name email');

    return NextResponse.json(newTeam, { status: 201 });
  } catch (error:any) {
    console.error('Error creating team:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}