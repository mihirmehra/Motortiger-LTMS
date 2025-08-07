import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Lead from '@/models/Lead';
import { authenticateUser, checkPermission } from '@/lib/utils/auth';
import { sendEmail, emailTemplates } from '@/lib/email/emailService';

export const dynamic = 'force-dynamic';

// Define the allowed template types based on your emailTemplates object
type EmailTemplateType = keyof typeof emailTemplates;

interface RequestBody {
  leadId: string;
  templateType?: EmailTemplateType;
  customSubject?: string;
  customContent?: string;
}

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

    const { leadId, templateType, customSubject, customContent } = await request.json() as RequestBody;

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return NextResponse.json({ message: 'Lead not found' }, { status: 404 });
    }

    // Check if user can send email to this lead
    if (user.role === 'agent' && lead.assignedTo.toString() !== user._id.toString()) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    let emailContent: { subject: string; html: string; text: string };

    if (templateType && templateType in emailTemplates) {
      // Handle different template signatures if needed
      if (templateType === 'leadFollowUp') {
        emailContent = emailTemplates.leadFollowUp(
          lead.customerName,
          lead.productName,
          user.name
        );
      } else if (templateType === 'leadWelcome') {
        emailContent = emailTemplates.leadWelcome(
          lead.customerName,
          lead.productName
        );
      } else {
        // If you add more templates, handle them here
        return NextResponse.json({ message: 'Invalid template type' }, { status: 400 });
      }
    } else {
      emailContent = {
        subject: customSubject || 'Message from Motor Tiger USA',
        html: customContent || 'Thank you for your interest in our products.',
        text: customContent || 'Thank you for your interest in our products.'
      };
    }

    // For demo purposes, we'll use a placeholder email
    // In production, you'd need the customer's email address
    const customerEmail = `${lead.customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`;

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
