import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Lead from '@/models/Lead';
import Target from '@/models/Target';
import User from '@/models/User';
import { authenticateUser, checkPermission } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!checkPermission(user, 'read', 'reports')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const from = new Date(searchParams.get('from') || new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const to = new Date(searchParams.get('to') || new Date());

    let leadQuery: Record<string, any> = {
      createdAt: { $gte: from, $lte: to }
    };

    // Filter based on user role
    if (user.role === 'manager') {
      const teamMembers = await User.find({ 
        createdBy: user._id,
        role: 'agent' 
      }).select('_id');
      
      const teamMemberIds = teamMembers.map(member => member._id);
      teamMemberIds.push(user._id);
      
      leadQuery = { ...leadQuery, assignedTo: { $in: teamMemberIds } };
    }

    // Fetch leads data
    const leads = await Lead.find(leadQuery)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    // Fetch targets data
    const targets = await Target.find({
      date: { $gte: from, $lte: to }
    }).populate('createdBy', 'name email');

    // Calculate sales data
    const sales = leads.filter(lead => lead.status === 'sold');

    const reportData = {
      leads,
      targets,
      sales,
      summary: {
        totalLeads: leads.length,
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, sale) => sum + (sale.profitMargin || 0), 0),
        conversionRate: leads.length > 0 ? ((sales.length / leads.length) * 100).toFixed(1) : 0
      }
    };

    return NextResponse.json(reportData);
  } catch (error:any) {
    console.error('Error fetching report data:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}