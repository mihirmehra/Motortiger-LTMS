import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Lead from '@/models/Lead';
import Target from '@/models/Target';
import User from '@/models/User';
import { authenticateUser } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request);
  if (!user) {
    console.error('Dashboard stats: User not authenticated');
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    
    let leadQuery = {};
    
    // Filter stats based on user role
    if (user.role === 'agent') {
      leadQuery = { assignedTo: user._id };
    } else if (user.role === 'manager') {
      // Manager can see stats for their team members
      const teamMembers = await User.find({ 
        createdBy: user._id,
        role: 'agent' 
      }).select('_id');
      
      const teamMemberIds = teamMembers.map(member => member._id);
      teamMemberIds.push(user._id); // Include manager's own leads
      
      leadQuery = { assignedTo: { $in: teamMemberIds } };
    }
    // Admin can see all stats (no filter)
    
    const totalLeads = await Lead.countDocuments(leadQuery);
    const newLeads = await Lead.countDocuments({ ...leadQuery, status: 'new' });
    const soldLeads = await Lead.countDocuments({ ...leadQuery, status: 'sold' });
    
    // Calculate target progress
    const targets = await Target.find();
    const totalTarget = targets.reduce((sum, target) => sum + target.amount, 0);
    const achievedTarget = targets.reduce((sum, target) => sum + target.achieved, 0);
    const targetProgress = totalTarget > 0 ? Math.round((achievedTarget / totalTarget) * 100) : 0;
    
    const stats = {
      totalLeads,
      newLeads,
      soldLeads,
      targetProgress
    };
    return NextResponse.json(stats);
  } catch (error:any) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}