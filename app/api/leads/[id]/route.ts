import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Lead from '@/models/Lead';
import Target from '@/models/Target';
import { authenticateUser, checkPermission } from '@/lib/utils/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!checkPermission(user, 'update', 'leads')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const leadData = await request.json();
    const leadId = params.id;

    // Find the existing lead
    const existingLead = await Lead.findById(leadId);
    if (!existingLead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    // Check if user can update this lead
    if (user.role === 'agent' && existingLead.assignedTo.toString() !== user._id.toString()) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Check if status is being changed to 'sold'
    const wasNotSold = existingLead.status !== 'sold';
    const isNowSold = leadData.status === 'sold';

    // Update the lead
    const updatedLead = await Lead.findByIdAndUpdate(
      leadId,
      {
        ...leadData,
        assignedTo: leadData.assignedTo === 'unassigned' ? null : leadData.assignedTo
      },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email').populate('createdBy', 'name email');

    // If lead status changed to 'sold', subtract profit margin from main target
    if (wasNotSold && isNowSold && updatedLead.profitMargin) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find today's target or create one
      let todayTarget = await Target.findOne({ date: today });
      
      if (todayTarget) {
        // Subtract profit margin from remaining target (achieved goes up)
        todayTarget.achieved += Math.abs(updatedLead.profitMargin);
        await todayTarget.save();
      } else {
        // Create a new target for today if it doesn't exist
        todayTarget = new Target({
          date: today,
          amount: 0,
          achieved: Math.abs(updatedLead.profitMargin),
          description: 'Auto-created from lead sale',
          createdBy: user._id
        });
        await todayTarget.save();
      }
    }

    // If lead status changed from 'sold' to something else, reverse the target update
    if (!wasNotSold && !isNowSold && existingLead.profitMargin) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let todayTarget = await Target.findOne({ date: today });
      if (todayTarget) {
        todayTarget.achieved = Math.max(0, todayTarget.achieved - Math.abs(existingLead.profitMargin));
        await todayTarget.save();
      }
    }

    return NextResponse.json(updatedLead);
  } catch (error:any) {
    console.error('Error updating lead:', error);
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

  if (!checkPermission(user, 'delete', 'leads')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const leadId = params.id;
    const lead = await Lead.findById(leadId);
    
    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    // Check if user can delete this lead
    if (user.role === 'agent' && lead.assignedTo.toString() !== user._id.toString()) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await Lead.findByIdAndDelete(leadId);

    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error:any) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}