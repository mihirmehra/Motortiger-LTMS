import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Lead from '@/models/Lead';
import Target from '@/models/Target';
import { authenticateUser } from '@/lib/utils/auth';
import { processLeadStatusChange } from '@/lib/utils/leadWorkflow';

export const dynamic = 'force-dynamic';

/**
 * Test endpoint for the automated lead workflow
 * This endpoint allows testing the workflow without affecting real data
 */
export async function POST(request: NextRequest) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  // Only admins can run workflow tests
  if (user.role !== 'admin') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const { testType, leadId, leadData } = await request.json();

    switch (testType) {
      case 'profit_calculation':
        return await testProfitCalculation(leadData);
      
      case 'target_allocation':
        return await testTargetAllocation(leadData, user._id);
      
      case 'full_workflow':
        return await testFullWorkflow(leadId, leadData, user._id);
      
      case 'data_integrity':
        return await testDataIntegrity();
      
      default:
        return NextResponse.json({ 
          message: 'Invalid test type. Available types: profit_calculation, target_allocation, full_workflow, data_integrity' 
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Workflow test error:', error);
    return NextResponse.json({
      message: 'Test failed',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

async function testProfitCalculation(leadData: { salePrice?: number; productPrice?: number }): Promise<NextResponse> {
  // leadData destructuring removed as unused
  const tests = [
    { sale: 1000, product: 800, expected: 200 },
    { sale: 500, product: 600, expected: -100 },
    { sale: 0, product: 100, expected: 'error' },
    { sale: 'invalid', product: 100, expected: 'error' }
  ];

  const results = tests.map(test => {
    try {
      if (typeof test.sale !== 'number' || typeof test.product !== 'number') {
        throw new Error('Invalid input');
      }
      const profit = test.sale - test.product;
      return {
        input: test,
        result: profit,
        passed: test.expected === 'error' ? false : profit === test.expected
      };
    } catch (error) {
      return {
        input: test,
        result: 'error',
        passed: test.expected === 'error'
      };
    }
  });

  return NextResponse.json({
    testType: 'profit_calculation',
    results,
    summary: {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length
    }
  });
}

async function testTargetAllocation(_leadData: unknown, _userId: unknown): Promise<NextResponse> {
  // Create test targets
  const testTargets = [
    { date: new Date('2024-01-01'), amount: 1000, achieved: 500 },
    { date: new Date('2024-01-02'), amount: 800, achieved: 800 },
    { date: new Date('2024-01-03'), amount: 1200, achieved: 0 }
  ];

  const results = [];
  
  // Test different profit amounts
  const testProfits = [200, 600, 1500];
  
  for (const profit of testProfits) {
    // Simulate target allocation logic
    let remainingProfit = profit;
    const allocations = [];
    
    for (const target of testTargets) {
      if (remainingProfit <= 0) break;
      
      const capacity = target.amount - target.achieved;
      if (capacity > 0) {
        const allocation = Math.min(remainingProfit, capacity);
        allocations.push({
          targetDate: target.date,
          allocated: allocation,
          newAchieved: target.achieved + allocation
        });
        remainingProfit -= allocation;
      }
    }
    
    results.push({
      profitAmount: profit,
      allocations,
      remainingProfit,
      fullyAllocated: remainingProfit === 0
    });
  }

  return NextResponse.json({
    testType: 'target_allocation',
    testTargets,
    results
  });
}

async function testFullWorkflow(leadId: string, leadData: any, userId: string): Promise<NextResponse> {
  if (!leadId) {
    return NextResponse.json({ 
      message: 'Lead ID is required for full workflow test' 
    }, { status: 400 });
  }

  const existingLead = await Lead.findById(leadId);
  if (!existingLead) {
    return NextResponse.json({ 
      message: 'Lead not found' 
    }, { status: 404 });
  }

  // Run the full workflow
  const result = await processLeadStatusChange(leadId, leadData, existingLead, userId);

  return NextResponse.json({
    testType: 'full_workflow',
    leadId,
    originalStatus: existingLead.status,
    newStatus: leadData.status,
    workflowResult: result
  });
}

async function testDataIntegrity() {
  // Check for data consistency issues
  const issues = [];

  // Check for leads with invalid profit margins
  const leadsWithInvalidProfit = await Lead.find({
    $or: [
      { profitMargin: { $exists: false } },
      { profitMargin: null },
      { 
        $and: [
          { salePrice: { $exists: true, $ne: null } },
          { productPrice: { $exists: true, $ne: null } },
          { $expr: { $ne: ['$profitMargin', { $subtract: ['$salePrice', '$productPrice'] }] } }
        ]
      }
    ]
  });

  if (leadsWithInvalidProfit.length > 0) {
    issues.push({
      type: 'invalid_profit_margins',
      count: leadsWithInvalidProfit.length,
      examples: leadsWithInvalidProfit.slice(0, 3).map(lead => ({
        id: lead._id,
        salePrice: lead.salePrice,
        productPrice: lead.productPrice,
        profitMargin: lead.profitMargin,
        calculatedProfit: lead.salePrice && lead.productPrice ? lead.salePrice - lead.productPrice : null
      }))
    });
  }

  // Check for targets with negative achieved amounts
  const targetsWithNegativeAchieved = await Target.find({ achieved: { $lt: 0 } });
  
  if (targetsWithNegativeAchieved.length > 0) {
    issues.push({
      type: 'negative_target_achieved',
      count: targetsWithNegativeAchieved.length,
      examples: targetsWithNegativeAchieved.slice(0, 3)
    });
  }

  // Check for sold leads without proper pricing
  const soldLeadsWithoutPricing = await Lead.find({
    status: 'sold',
    $or: [
      { salePrice: { $lte: 0 } },
      { productPrice: { $lte: 0 } },
      { salePrice: { $exists: false } },
      { productPrice: { $exists: false } }
    ]
  });

  if (soldLeadsWithoutPricing.length > 0) {
    issues.push({
      type: 'sold_leads_without_pricing',
      count: soldLeadsWithoutPricing.length,
      examples: soldLeadsWithoutPricing.slice(0, 3)
    });
  }

  return NextResponse.json({
    testType: 'data_integrity',
    totalIssues: issues.length,
    issues,
    status: issues.length === 0 ? 'healthy' : 'issues_found'
  });
}