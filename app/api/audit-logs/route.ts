import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import AuditLog from '@/models/AuditLog';
import { authenticateUser } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only admins can view audit logs
  if (user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const entityType = searchParams.get('entityType');
    const action = searchParams.get('action');
    const entityId = searchParams.get('entityId');
    
    let query: { [key: string]: any } = {};
    
    if (entityType) {
      query.entityType = entityType;
    }
    
    if (action) {
      query.action = action;
    }
    
    if (entityId) {
      query.entityId = entityId;
    }
    
    const skip = (page - 1) * limit;
    
    const auditLogs = await AuditLog.find(query)
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await AuditLog.countDocuments(query);
    
    return NextResponse.json({
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}