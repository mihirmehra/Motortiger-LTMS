import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Lead from '@/models/Lead';
import User from '@/models/User';
import { authenticateUser, checkPermission } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!checkPermission(user, 'read', 'leads')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    let query = {};
    
    // Filter leads based on user role
    if (user.role === 'agent') {
      // Agents can only see their own leads
      query = { assignedTo: user._id };
    } else if (user.role === 'manager') {
      // Managers can see leads assigned to their team members
      const teamMembers = await User.find({ 
        createdBy: user._id,
        role: 'agent' 
      }).select('_id');
      
      const teamMemberIds = teamMembers.map(member => member._id);
      teamMemberIds.push(user._id); // Include manager's own leads
      
      query = { assignedTo: { $in: teamMemberIds } };
    }
    // Admins can see all leads (no filter)

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json(leads);
  } catch (error:any) {
    console.error('Error fetching leads:', error);
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

  if (!checkPermission(user, 'create', 'leads')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const leadData = await request.json();
    
    // Check if mobile number already exists
    const existingLead = await Lead.findOne({ mobileNumber: leadData.mobileNumber });
    if (existingLead) {
      return NextResponse.json(
        { message: 'Mobile number already exists' },
        { status: 400 }
      );
    }

    // Create new lead
    const newLead = new Lead({
      customerName: leadData.customerName,
      mobileNumber: leadData.mobileNumber,
      productName: leadData.productName,
      productPrice: leadData.productPrice,
      salePrice: leadData.salePrice,
      source: leadData.source,
      status: leadData.status || 'new',
      assignedTo: leadData.assignedTo === 'unassigned' ? null : (leadData.assignedTo || (user.role === 'agent' ? user._id : null)),
      createdBy: user._id
    });

    await newLead.save();
    
    // Populate the assigned user info
    await newLead.populate('assignedTo', 'name email');
    await newLead.populate('createdBy', 'name email');

    return NextResponse.json(newLead, { status: 201 });
  } catch (error:any) {
    console.error('Error creating lead:', error);
    
    if (error.code === 11000) {
      return NextResponse.json(
        { message: 'Mobile number already exists' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}