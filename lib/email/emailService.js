import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'motortigerusa@gmail.com',
    pass: 'wnzy kkcw heea xlun'
  }
});

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: 'motortigerusa@gmail.com',
      to,
      subject,
      html,
      text
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error:any) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

export const emailTemplates = {
  leadFollowUp: (customerName, productName, agentName) => ({
    subject: `Follow-up on ${productName || 'Your Inquiry'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Motor Tiger USA</h2>
        <p>Dear ${customerName},</p>
        <p>Thank you for your interest in ${productName || 'our products'}. We wanted to follow up on your inquiry and see if you have any questions.</p>
        <p>Our team is here to help you find the perfect engine parts for your needs. Please don't hesitate to reach out if you need any assistance.</p>
        <p>Best regards,<br>${agentName}<br>Motor Tiger USA</p>
        <hr style="margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          Motor Tiger USA - Your trusted partner for quality used engine parts
        </p>
      </div>
    `,
    text: `Dear ${customerName}, Thank you for your interest in ${productName || 'our products'}. We wanted to follow up on your inquiry. Best regards, ${agentName}, Motor Tiger USA`
  }),

  leadWelcome: (customerName, productName) => ({
    subject: 'Welcome to Motor Tiger USA',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Welcome to Motor Tiger USA!</h2>
        <p>Dear ${customerName},</p>
        <p>Thank you for choosing Motor Tiger USA for your engine parts needs. We're excited to help you find the perfect ${productName || 'solution'}.</p>
        <p>Our team of experts is dedicated to providing you with high-quality used engine parts at competitive prices.</p>
        <p>We'll be in touch soon with more information about your inquiry.</p>
        <p>Best regards,<br>The Motor Tiger USA Team</p>
      </div>
    `,
    text: `Welcome to Motor Tiger USA! Thank you for choosing us for your engine parts needs.`
  })
};