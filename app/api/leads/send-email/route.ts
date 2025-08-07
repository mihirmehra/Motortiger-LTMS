import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Lead from '@/models/Lead';
import { authenticateUser, checkPermission } from '@/lib/utils/auth';
import { sendEmail, emailTemplates } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!checkPermission(user, 'send', 'emails')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();
    
    const { leadId, templateType, customSubject, customContent } = await request.json();

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    // Check if user can send email to this lead
    if (user.role === 'agent' && lead.assignedTo.toString() !== user._id.toString()) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    let emailContent;
    
    if (templateType && emailTemplates[templateType]) {
      emailContent = emailTemplates[templateType](
        lead.customerName,
        lead.productName,
        user.name
      );
    } else {
      emailContent = {
        subject: customSubject || 'Message from Motor Tiger USA',
        html: customContent || 'Thank you for your interest in our products.',
        text: customContent || 'Thank you for your interest in our products.'
      };
    }

    // For demo purposes, we'll use a placeholder email
    // In production, you'd need the customer's email address
    const customerEmail = lead.email || `${lead.customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`;

    const result = await sendEmail({
      to: customerEmail,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text
    });

    if (result.success) {
      // Add email to lead history
      lead.emailHistory.push({
        subject: emailContent.subject,
        content: emailContent.html,
        sentBy: user._id,
        sentAt: new Date()
      });
      await lead.save();

      return NextResponse.json({ 
        message: 'Email sent successfully',
        messageId: result.messageId 
      });
    } else {
      return NextResponse.json(
        { message: 'Failed to send email', error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}