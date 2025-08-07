import Target from '@/models/Target';
import AuditLog from '@/models/AuditLog';
import mongoose from 'mongoose';

/**
 * Automated Lead Workflow System
 * Handles profit calculation, target management, and audit logging
 */

export class LeadWorkflowManager {
  constructor() {
    this.session = null;
  }

  /**
   * Initialize a database session for transaction support
   */
  async initializeSession() {
    this.session = await mongoose.startSession();
    return this.session;
  }

  /**
   * Calculate profit margin with validation
   */
  calculateProfitMargin(salePrice, productPrice) {
    // Input validation
    if (!salePrice || !productPrice || isNaN(salePrice) || isNaN(productPrice)) {
      throw new Error('Invalid price data: Both sale price and product price must be valid numbers');
    }

    if (salePrice < 0 || productPrice < 0) {
      throw new Error('Invalid price data: Prices cannot be negative');
    }

    return Number((salePrice - productPrice).toFixed(2));
  }

  /**
   * Update targets using FIFO method (First In, First Out)
   */
  async updateTargetsWithProfit(profitMargin, userId) {
    if (!this.session) {
      throw new Error('Database session not initialized');
    }

    if (profitMargin <= 0) {
      return { 
        success: true, 
        message: 'No profit to allocate',
        updatedTargets: [],
        totalAllocated: 0
      };
    }

    try {
      // Get all targets ordered by date (FIFO - oldest first)
      const targets = await Target.find()
        .sort({ date: 1, createdAt: 1 })
        .session(this.session);

      let remainingProfit = profitMargin;
      const updatedTargets = [];

      // Allocate profit to existing targets first
      for (const target of targets) {
        if (remainingProfit <= 0) break;

        const remainingTargetCapacity = Math.max(0, target.amount - target.achieved);
        
        if (remainingTargetCapacity > 0) {
          const allocationAmount = Math.min(remainingProfit, remainingTargetCapacity);
          
          target.achieved = Number((target.achieved + allocationAmount).toFixed(2));
          remainingProfit = Number((remainingProfit - allocationAmount).toFixed(2));
          
          await target.save({ session: this.session });
          
          updatedTargets.push({
            targetId: target._id,
            targetDate: target.date,
            allocated: allocationAmount,
            previousAchieved: target.achieved - allocationAmount,
            newAchieved: target.achieved,
            targetAmount: target.amount,
            isComplete: target.achieved >= target.amount
          });
        }
      }

      // If there's still remaining profit, create a new target for today
      if (remainingProfit > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if a target already exists for today
        let todayTarget = await Target.findOne({ date: today }).session(this.session);
        
        if (todayTarget) {
          // Add to existing today's target
          todayTarget.achieved = Number((todayTarget.achieved + remainingProfit).toFixed(2));
          await todayTarget.save({ session: this.session });
          
          updatedTargets.push({
            targetId: todayTarget._id,
            targetDate: todayTarget.date,
            allocated: remainingProfit,
            previousAchieved: todayTarget.achieved - remainingProfit,
            newAchieved: todayTarget.achieved,
            targetAmount: todayTarget.amount,
            isComplete: todayTarget.achieved >= todayTarget.amount,
            isExistingTarget: true
          });
        } else {
          // Create new target for today
          const newTarget = new Target({
            date: today,
            amount: remainingProfit,
            achieved: remainingProfit,
            description: 'Auto-created from excess profit allocation',
            createdBy: userId
          });
          
          await newTarget.save({ session: this.session });
          
          updatedTargets.push({
            targetId: newTarget._id,
            targetDate: newTarget.date,
            allocated: remainingProfit,
            previousAchieved: 0,
            newAchieved: remainingProfit,
            targetAmount: remainingProfit,
            isComplete: true,
            isNewTarget: true
          });
        }
      }

      return {
        success: true,
        message: 'Targets updated successfully using FIFO method',
        updatedTargets,
        totalAllocated: profitMargin,
        remainingProfit: 0
      };

    } catch (error) {
      console.error('Error in updateTargetsWithProfit:', error);
      throw new Error(`Failed to update targets: ${error.message}`);
    }
  }

  /**
   * Reverse profit allocation from targets (for status changes from sold to other)
   */
  async reverseTargetAllocation(profitAmount, userId) {
    if (!this.session) {
      throw new Error('Database session not initialized');
    }

    if (profitAmount <= 0) {
      return { 
        success: true, 
        message: 'No profit to remove',
        updatedTargets: [],
        totalRemoved: 0
      };
    }

    try {
      // Get targets in reverse order (LIFO - Last In, First Out for removal)
      const targets = await Target.find({ achieved: { $gt: 0 } })
        .sort({ date: -1, createdAt: -1 })
        .session(this.session);

      let remainingToRemove = profitAmount;
      const updatedTargets = [];

      for (const target of targets) {
        if (remainingToRemove <= 0) break;

        const removalAmount = Math.min(remainingToRemove, target.achieved);
        
        if (removalAmount > 0) {
          const previousAchieved = target.achieved;
          target.achieved = Number((target.achieved - removalAmount).toFixed(2));
          remainingToRemove = Number((remainingToRemove - removalAmount).toFixed(2));
          
          await target.save({ session: this.session });
          
          updatedTargets.push({
            targetId: target._id,
            targetDate: target.date,
            removed: removalAmount,
            previousAchieved,
            newAchieved: target.achieved,
            targetAmount: target.amount
          });
        }
      }

      return {
        success: true,
        message: 'Profit allocation reversed successfully',
        updatedTargets,
        totalRemoved: profitAmount - remainingToRemove,
        remainingToRemove
      };

    } catch (error) {
      console.error('Error in reverseTargetAllocation:', error);
      throw new Error(`Failed to reverse target allocation: ${error.message}`);
    }
  }

  /**
   * Log audit trail for lead operations
   */
  async logAuditTrail(action, leadId, userId, details = {}) {
    try {
      const auditLog = new AuditLog({
        action,
        entityType: 'Lead',
        entityId: leadId,
        userId,
        details: {
          ...details,
          timestamp: new Date(),
          sessionId: this.session?.id
        },
        timestamp: new Date()
      });

      await auditLog.save({ session: this.session });
      return auditLog;
    } catch (error) {
      console.error('Failed to log audit trail:', error);
      // Don't throw error for audit logging failures
      return null;
    }
  }

  /**
   * Validate lead data for sold status
   */
  validateSoldLead(leadData) {
    const errors = [];

    if (!leadData.salePrice || leadData.salePrice <= 0) {
      errors.push('Sale price must be greater than 0 for sold leads');
    }

    if (!leadData.productPrice || leadData.productPrice <= 0) {
      errors.push('Product price must be greater than 0 for sold leads');
    }

    if (isNaN(leadData.salePrice) || isNaN(leadData.productPrice)) {
      errors.push('Sale price and product price must be valid numbers');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Clean up session
   */
  async cleanup() {
    if (this.session) {
      await this.session.endSession();
      this.session = null;
    }
  }
}

/**
 * Main workflow function for processing lead status changes
 */
export async function processLeadStatusChange(leadId, leadData, existingLead, userId) {
  const workflow = new LeadWorkflowManager();
  
  try {
    // Initialize database session
    await workflow.initializeSession();
    await workflow.session.startTransaction();

    const result = {
      success: false,
      lead: null,
      targetUpdates: null,
      auditLog: null,
      errors: []
    };

    // Status change detection
    const wasNotSold = existingLead.status !== 'sold';
    const isNowSold = leadData.status === 'sold';
    const wasSold = existingLead.status === 'sold';
    const isNoLongerSold = leadData.status !== 'sold';

    // Validate sold lead data
    if (isNowSold) {
      const validation = workflow.validateSoldLead(leadData);
      if (!validation.isValid) {
        result.errors = validation.errors;
        return result;
      }
    }

    // Calculate profit margin
    let profitMargin = 0;
    if (leadData.salePrice && leadData.productPrice) {
      profitMargin = workflow.calculateProfitMargin(
        parseFloat(leadData.salePrice),
        parseFloat(leadData.productPrice)
      );
    }

    // Handle status change to 'sold'
    if (wasNotSold && isNowSold && profitMargin > 0) {
      result.targetUpdates = await workflow.updateTargetsWithProfit(profitMargin, userId);
      
      result.auditLog = await workflow.logAuditTrail(
        'LEAD_SOLD',
        leadId,
        userId,
        {
          customerName: existingLead.customerName,
          salePrice: parseFloat(leadData.salePrice),
          productPrice: parseFloat(leadData.productPrice),
          profitMargin,
          targetUpdates: result.targetUpdates.updatedTargets
        }
      );
    }

    // Handle status change from 'sold' to something else
    if (wasSold && isNoLongerSold && existingLead.profitMargin > 0) {
      result.targetUpdates = await workflow.reverseTargetAllocation(
        existingLead.profitMargin,
        userId
      );
      
      result.auditLog = await workflow.logAuditTrail(
        'LEAD_STATUS_CHANGED',
        leadId,
        userId,
        {
          previousStatus: 'sold',
          newStatus: leadData.status,
          profitRemoved: existingLead.profitMargin,
          targetUpdates: result.targetUpdates.updatedTargets
        }
      );
    }

    // Commit transaction
    await workflow.session.commitTransaction();
    result.success = true;

    return result;

  } catch (error) {
    // Rollback transaction on error
    if (workflow.session) {
      await workflow.session.abortTransaction();
    }
    
    console.error('Lead workflow error:', error);
    throw error;
  } finally {
    // Clean up session
    await workflow.cleanup();
  }
}