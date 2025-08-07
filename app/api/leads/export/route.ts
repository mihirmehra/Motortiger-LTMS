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
      query = { assignedTo: user._id };
    } else if (user.role === 'manager') {
      const teamMembers = await User.find({ 
        createdBy: user._id,
        role: 'agent' 
      }).select('_id');
      
      const teamMemberIds = teamMembers.map(member => member._id);
      teamMemberIds.push(user._id);
      
      query = { assignedTo: { $in: teamMemberIds } };
    }

    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    // Create CSV content
    const csvHeaders = [
      'Customer Name',
      'Mobile Number',
      'Product Name',
      'Product Price',
      'Sale Price',
      'Profit Margin',
      'Sale Price',
      'Profit Margin',
      'Source',
      'Status',
      'Assigned To',
      'Created By',
      'Created Date'
    ];

    const csvRows = leads.map(lead => [
      lead.customerName,
      lead.mobileNumber,
      lead.productName || '',
      lead.productPrice || '',
      lead.salePrice || '',
      lead.profitMargin || '',
      lead.salePrice || '',
      lead.profitMargin || '',
      lead.source || '',
      lead.status,
      typeof lead.assignedTo === 'object' ? lead.assignedTo.name : lead.assignedTo,
      typeof lead.createdBy === 'object' ? lead.createdBy.name : lead.createdBy,
      new Date(lead.createdAt).toLocaleDateString()
    ]);

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });
  } catch (error) {
    console.error('Error exporting leads:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}