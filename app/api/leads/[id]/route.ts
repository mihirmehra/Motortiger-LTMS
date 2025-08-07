import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Lead from '@/models/Lead';
import Target from '@/models/Target';
import AuditLog from '@/models/AuditLog';
import { authenticateUser, checkPermission } from '@/lib/utils/auth';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

// Helper function to calculate profit margin
const calculateProfitMargin = (salePrice: number, productPrice: number): number => {
  if (!salePrice || !productPrice || isNaN(salePrice) || isNaN(productPrice)) {
    return 0;
  }
  return salePrice - productPrice;
};

// Helper function to log audit trail
const logAuditTrail = async (action: string, leadId: string, userId: string, details: any) => {
  try {
    const auditLog = new AuditLog({
      action,
      entityType: 'Lead',
      entityId: leadId,
      userId,
      details,
      timestamp: new Date()
    });
    await auditLog.save();
  } catch (error) {
    console.error('Failed to log audit trail:', error);
  }
};

// Helper function to update targets using FIFO method
const updateTargetsWithProfit = async (profitMargin: number, userId: string, session: any) => {
  if (profitMargin <= 0) {
    return { success: true, message: 'No profit to allocate' };
  }

  try {
    // Get all targets ordered by date (FIFO - oldest first)
    const targets = await Target.find()
      .sort({ date: 1 })
      .session(session);

    let remainingProfit = profitMargin;
    const updatedTargets = [];

    for (const target of targets) {
      if (remainingProfit <= 0) break;

      const remainingTargetCapacity = target.amount - target.achieved;
      
      if (remainingTargetCapacity > 0) {
        const allocationAmount = Math.min(remainingProfit, remainingTargetCapacity);
        
        target.achieved += allocationAmount;
        remainingProfit -= allocationAmount;
        
        await target.save({ session });
        updatedTargets.push({
          targetId: target._id,
          allocated: allocationAmount,
          newAchieved: target.achieved
        });
      }
    }

    // If there's still remaining profit and no targets available, create a new target
    if (remainingProfit > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const newTarget = new Target({
        date: today,
        amount: remainingProfit,
        achieved: remainingProfit,
        description: 'Auto-created from excess profit',
        createdBy: userId
      });
      
      await newTarget.save({ session });
      updatedTargets.push({
        targetId: newTarget._id,
        allocated: remainingProfit,
        newAchieved: remainingProfit,
        isNewTarget: true
      });
    }

    return {
      success: true,
      message: 'Targets updated successfully',
      updatedTargets,
      totalAllocated: profitMargin
    };
  } catch (error) {
    console.error('Error updating targets:', error);
    throw new Error('Failed to update targets with profit allocation');
  }
};

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
    
    // Start a database session for transaction support
    const session = await mongoose.startSession();
    
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

    // Data validation
    const salePrice = parseFloat(leadData.salePrice) || 0;
    const productPrice = parseFloat(leadData.productPrice) || 0;
    
    if (leadData.status === 'sold') {
      if (salePrice <= 0) {
        return NextResponse.json({ 
          message: 'Sale price must be greater than 0 for sold leads' 
        }, { status: 400 });
      }
      if (productPrice <= 0) {
        return NextResponse.json({ 
          message: 'Product price must be greater than 0 for sold leads' 
        }, { status: 400 });
      }
    }

    // Calculate profit margin
    const calculatedProfitMargin = calculateProfitMargin(salePrice, productPrice);
    
    // Prepare updated lead data with calculated profit margin
    const updatedLeadData = {
      ...leadData,
      assignedTo: leadData.assignedTo === 'unassigned' ? null : leadData.assignedTo,
      profitMargin: calculatedProfitMargin
    };

    // Status change detection
    const wasNotSold = existingLead.status !== 'sold';
    const isNowSold = leadData.status === 'sold';
    const wasSold = existingLead.status === 'sold';
    const isNoLongerSold = leadData.status !== 'sold';

    try {
      // Start transaction
      await session.startTransaction();

      // Update the lead with calculated profit margin
      const updatedLead = await Lead.findByIdAndUpdate(
        leadId,
        updatedLeadData,
        { 
          new: true, 
          runValidators: true,
          session 
        }
      ).populate('assignedTo', 'name email').populate('createdBy', 'name email');

      if (!updatedLead) {
        throw new Error('Failed to update lead');
      }

      let targetUpdateResult = null;

      // Handle status change to 'sold' - add profit to targets
      if (wasNotSold && isNowSold && calculatedProfitMargin > 0) {
        targetUpdateResult = await updateTargetsWithProfit(
          calculatedProfitMargin, 
          user._id, 
          session
        );

        // Log audit trail for sale
        await logAuditTrail(
          'LEAD_SOLD',
          leadId,
          user._id.toString(),
          {
            customerName: updatedLead.customerName,
            salePrice,
            productPrice,
            profitMargin: calculatedProfitMargin,
            targetUpdates: targetUpdateResult.updatedTargets
          }
        );
      }

      // Handle status change from 'sold' to something else - subtract profit from targets
      if (wasSold && isNoLongerSold && existingLead.profitMargin) {
        // Reverse the profit allocation (subtract from targets in reverse FIFO order)
        const targets = await Target.find()
          .sort({ date: -1 }) // Reverse order for removal
          .session(session);

        let remainingToRemove = Math.abs(existingLead.profitMargin);
        const updatedTargets = [];

        for (const target of targets) {
          if (remainingToRemove <= 0) break;

          const removalAmount = Math.min(remainingToRemove, target.achieved);
          
          if (removalAmount > 0) {
            target.achieved -= removalAmount;
            remainingToRemove -= removalAmount;
            
            await target.save({ session });
            updatedTargets.push({
              targetId: target._id,
              removed: removalAmount,
              newAchieved: target.achieved
            });
          }
        }

        // Log audit trail for status change
        await logAuditTrail(
          'LEAD_STATUS_CHANGED',
          leadId,
          user._id.toString(),
          {
            previousStatus: 'sold',
            newStatus: leadData.status,
            profitRemoved: Math.abs(existingLead.profitMargin),
            targetUpdates: updatedTargets
          }
        );
      }

      // Commit transaction
      await session.commitTransaction();

      return NextResponse.json({
        ...updatedLead.toObject(),
        targetUpdateResult
      });

    } catch (error:any) {
      // Rollback transaction on error
      await session.abortTransaction();
      console.error('Transaction failed:', error);
      
      return NextResponse.json({
        message: 'Failed to update lead and targets',
        error: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    } finally {
      // End session
      await session.endSession();
    }

  } catch (error) {
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
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}