import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { authenticateUser } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    
    let leadQuery = {};
    
    // Filter activities based on user role
    if (user.role === 'agent') {
      leadQuery = { assignedTo: user._id };
    } else if (user.role === 'manager') {
      // Manager can see activities for their team members
      const teamMembers = await User.find({ 
        createdBy: user._id,
        role: 'agent' 
      }).select('_id');
      
      const teamMemberIds = teamMembers.map(member => member._id);
      teamMemberIds.push(user._id); // Include manager's own activities
      
      leadQuery = { assignedTo: { $in: teamMemberIds } };
    }
    // Admin can see all activities (no filter)
    
    // Get recent leads for activities
    const recentLeads = await Lead.find(leadQuery)
      .populate('assignedTo', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    
    const activities = recentLeads.map(lead => {
      const timeDiff = Date.now() - new Date(lead.createdAt).getTime();
      const hoursAgo = Math.floor(timeDiff / (1000 * 60 * 60));
      const timeString = hoursAgo < 1 ? 'Just now' : 
                        hoursAgo < 24 ? `${hoursAgo} hours ago` : 
                        `${Math.floor(hoursAgo / 24)} days ago`;
      
      return {
        id: lead._id,
        type: 'lead_created',
        description: `New lead created for ${lead.customerName}`,
        time: timeString,
        user: typeof lead.createdBy === 'object' ? lead.createdBy.name : 'Unknown'
      };
    });

    return NextResponse.json(activities);
  } catch (error:any) {
    console.error('Error fetching activities:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}