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
    const format = searchParams.get('format') || 'csv';

    let leadQuery = {
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

    const leads = await Lead.find(leadQuery)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });

    const targets = await Target.find({
      date: { $gte: from, $lte: to }
    }).populate('createdBy', 'name email');

    const sales = leads.filter(lead => lead.status === 'sold');

    // Create report data
    const reportData = {
      summary: {
        totalLeads: leads.length,
        totalSales: sales.length,
        totalRevenue: sales.reduce((sum, sale) => sum + (sale.profitMargin || 0), 0),
        conversionRate: leads.length > 0 ? ((sales.length / leads.length) * 100).toFixed(1) : 0,
        period: `${from.toLocaleDateString()} - ${to.toLocaleDateString()}`
      },
      leads: leads.map(lead => ({
        customerName: lead.customerName,
        mobileNumber: lead.mobileNumber,
        productName: lead.productName || '',
        productPrice: lead.productPrice || 0,
        salePrice: lead.salePrice || 0,
        profitMargin: lead.profitMargin || 0,
        status: lead.status,
        assignedTo: typeof lead.assignedTo === 'object' ? lead.assignedTo.name : lead.assignedTo,
        createdAt: lead.createdAt
      })),
      targets: targets.map(target => ({
        date: target.date,
        amount: target.amount,
        achieved: target.achieved,
        progress: target.amount > 0 ? ((target.achieved / target.amount) * 100).toFixed(1) : 0
      }))
    };

    if (format === 'excel') {
      // For Excel format, we'll return CSV for now (can be enhanced with actual Excel library)
      const csvHeaders = [
        'Report Summary',
        '',
        '',
        '',
        '',
        '',
        '',
        'Total Leads', reportData.summary.totalLeads,
        'Total Sales', reportData.summary.totalSales,
        'Total Revenue', reportData.summary.totalRevenue,
        'Conversion Rate', `${reportData.summary.conversionRate}%`,
        'Period', reportData.summary.period,
        '',
        'Lead Details',
        'Customer Name', 'Mobile Number', 'Product', 'Product Price', 'Sale Price', 'Profit', 'Status', 'Assigned To', 'Created Date'
      ];

      const csvRows = reportData.leads.map(lead => [
        lead.customerName,
        lead.mobileNumber,
        lead.productName,
        lead.productPrice,
        lead.salePrice,
        lead.profitMargin,
        lead.status,
        lead.assignedTo,
        new Date(lead.createdAt).toLocaleDateString()
      ]);

      const csvContent = [
        ...csvHeaders,
        ...csvRows.map(row => row.map(field => `"${field}"`))
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel',
          'Content-Disposition': `attachment; filename="report-${from.toISOString().split('T')[0]}-to-${to.toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return NextResponse.json(reportData);
  } catch (error) {
    console.error('Error exporting report:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}