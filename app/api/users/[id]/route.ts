import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Team from '@/models/Team';
import { authenticateUser, checkPermission } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!checkPermission(user, 'update', 'users')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const userData = await request.json();
    const userId = params.id;

    // Find the existing user
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if manager is trying to update a user they didn't create
    if (user.role === 'manager' && existingUser.createdBy?.toString() !== user._id.toString() && existingUser.role !== 'agent') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Agents cannot update users
    if (user.role === 'agent') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Handle team changes
    const oldTeam = existingUser.team?.toString();
    const newTeam = userData.team === 'no-team' ? null : userData.team;

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...userData,
        team: newTeam === 'no-team' || newTeam === '' ? null : newTeam
      },
      { new: true, runValidators: true }
    ).select('-password')
     .populate('team', 'name');

    // Update team memberships
    if (oldTeam !== newTeam) {
      // Remove user from old team
      if (oldTeam) {
        await Team.findByIdAndUpdate(
          oldTeam,
          { $pull: { members: userId } }
        );
      }
      
      // Add user to new team
      if (newTeam) {
        await Team.findByIdAndUpdate(
          newTeam,
          { $addToSet: { members: userId } }
        );
      }
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
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

  if (!checkPermission(user, 'delete', 'users')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const userId = params.id;
    const userToDelete = await User.findById(userId);
    
    if (!userToDelete) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Check if manager is trying to delete a user they didn't create
    if (user.role === 'manager' && userToDelete.createdBy?.toString() !== user._id.toString() && userToDelete.role !== 'agent') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Agents cannot delete users
    if (user.role === 'agent') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Prevent users from deleting themselves
    if (userId === user._id.toString()) {
      return NextResponse.json({ message: 'Cannot delete your own account' }, { status: 400 });
    }

    // Remove user from their team if they have one
    if (userToDelete.team) {
      await Team.findByIdAndUpdate(
        userToDelete.team,
        { $pull: { members: userId } }
      );
    }
    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}