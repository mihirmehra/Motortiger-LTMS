import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Team from '@/models/Team';
import User from '@/models/User';
import { authenticateUser } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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
    const teamId = params.id;

    // Find the existing team
    const existingTeam = await Team.findById(teamId);
    if (!existingTeam) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }

    // Check if manager can update this team
    if (user.role === 'manager' && existingTeam.manager.toString() !== user._id.toString()) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Get the old members list for comparison
    const oldMembers = existingTeam.members.map((id: any) => id.toString());
    const newMembers = teamData.members || [];

    // Update the team
    const updatedTeam = await Team.findByIdAndUpdate(
      teamId,
      teamData,
      { new: true, runValidators: true }
    ).populate('manager', 'name email')
     .populate('members', 'name email role')
     .populate('createdBy', 'name email');

    // Update user team assignments
    // Remove team from users who are no longer members
    const removedMembers = oldMembers.filter((id: any) => !newMembers.includes(id));
    if (removedMembers.length > 0) {
      await User.updateMany(
        { _id: { $in: removedMembers } },
        { $unset: { team: 1 } }
      );
    }

    // Add team to new members
    const addedMembers = newMembers.filter((id: any) => !oldMembers.includes(id));
    if (addedMembers.length > 0) {
      await User.updateMany(
        { _id: { $in: addedMembers } },
        { team: teamId }
      );
    }
    return NextResponse.json(updatedTeam);
  } catch (error:any) {
    console.error('Error updating team:', error);
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

  if (!['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const teamId = params.id;
    const team = await Team.findById(teamId);
    
    if (!team) {
      return NextResponse.json({ message: 'Team not found' }, { status: 404 });
    }

    // Check if manager can delete this team
    if (user.role === 'manager' && team.manager.toString() !== user._id.toString()) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Remove team reference from users
    await User.updateMany(
      { team: teamId },
      { $unset: { team: 1 } }
    );

    await Team.findByIdAndDelete(teamId);

    return NextResponse.json({ message: 'Team deleted successfully' });
  } catch (error:any) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}