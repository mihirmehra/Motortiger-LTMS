import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import User from '@/models/User';
import Team from '@/models/Team';
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
    
    let query: any = { isActive: true }; // Only fetch active users
    
    // Managers can only see users they created (agents)
    if (user.role === 'manager') {
      query = { 
        $or: [
          { createdBy: user._id, role: 'agent' }, // Agents created by this manager
          { _id: user._id } // The manager themselves
        ],
        isActive: true
      };
    } else if (user.role === 'admin') {
      // Admins can see all active users
      query = { isActive: true };
    }

    const users = await User.find(query)
      .select('-password')
      .populate('createdBy', 'name email')
      .populate('team', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json(users);
  } catch (error:any) {
    console.error('Error fetching users:', error);
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

  if (!checkPermission(user, 'create', 'users')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const userData = await request.json();
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Managers can only create agents
    if (user.role === 'manager' && userData.role !== 'agent') {
      return NextResponse.json(
        { message: 'Managers can only create agent accounts' },
        { status: 403 }
      );
    }

    // Agents cannot create users
    if (user.role === 'agent') {
      return NextResponse.json(
        { message: 'Agents cannot create user accounts' },
        { status: 403 }
      );
    }

    // Create new user
    const newUser = new User({
      name: userData.name,
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: userData.role,
      team: userData.team || null,
      createdBy: user._id
    });

    await newUser.save();
    
    // If user is assigned to a team, add them to the team's members list
    if (newUser.team) {
      await Team.findByIdAndUpdate(
        newUser.team,
        { $addToSet: { members: newUser._id } }
      );
    }

    // Remove password from response
    const userResponse = await User.findById(newUser._id)
      .select('-password')
      .populate('createdBy', 'name email')
      .populate('team', 'name');

    return NextResponse.json(userResponse, { status: 201 });
  } catch (error:any) {
    console.error('Error creating user:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}