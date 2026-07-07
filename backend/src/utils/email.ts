import nodemailer from 'nodemailer';
import { config } from '../config/env';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.email.smtp.host,
    port: config.email.smtp.port,
    secure: false, // true for 465, false for other ports
    auth: {
      user: config.email.smtp.user,
      pass: config.email.smtp.pass,
    },
  });
};

// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to CITBIF Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to CITBIF!</h2>
        <p>Dear ${name},</p>
        <p>Welcome to the Center for Innovation and Technology Business Incubation Forum platform. We're excited to have you on board!</p>
        <p>Your account has been successfully created. You can now:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Submit your startup application</li>
          <li>Connect with mentors and investors</li>
          <li>Participate in events and workshops</li>
        </ul>
        <p>If you have any questions, feel free to contact our support team.</p>
        <p>Best regards,<br>The CITBIF Team</p>
      </div>
    `,
  }),

  emailVerification: (name: string, verificationLink: string) => ({
    subject: 'Verify Your Email Address',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Verify Your Email Address</h2>
        <p>Dear ${name},</p>
        <p>Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationLink}</p>
        <p>This link will expire in 24 hours.</p>
        <p>Best regards,<br>The CITBIF Team</p>
      </div>
    `,
  }),

  passwordReset: (name: string, resetLink: string) => ({
    subject: 'Reset Your Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>Dear ${name},</p>
        <p>You requested to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetLink}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
        <p>Best regards,<br>The CITBIF Team</p>
      </div>
    `,
  }),

  applicationSubmitted: (name: string, applicationType: string) => ({
    subject: 'Application Submitted Successfully',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Application Submitted Successfully</h2>
        <p>Dear ${name},</p>
        <p>Your ${applicationType} application has been submitted successfully!</p>
        <p>Our team will review your application and get back to you within 5-7 business days.</p>
        <p>You can track your application status in your dashboard.</p>
        <p>Thank you for choosing CITBIF!</p>
        <p>Best regards,<br>The CITBIF Team</p>
      </div>
    `,
  }),

  applicationApproved: (name: string, applicationType: string) => ({
    subject: 'Application Approved!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #16a34a;">Congratulations! Your Application Has Been Approved</h2>
        <p>Dear ${name},</p>
        <p>We're excited to inform you that your ${applicationType} application has been approved!</p>
        <p>You can now access all the benefits of our platform and start your journey with us.</p>
        <p>Log in to your dashboard to get started.</p>
        <p>Welcome to the CITBIF family!</p>
        <p>Best regards,<br>The CITBIF Team</p>
      </div>
    `,
  }),

  eventReminder: (name: string, eventTitle: string, eventDate: string, eventTime: string) => ({
    subject: 'Event Reminder',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Event Reminder</h2>
        <p>Dear ${name},</p>
        <p>This is a reminder that you have registered for the following event:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0;">${eventTitle}</h3>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${eventTime}</p>
        </div>
        <p>We look forward to seeing you there!</p>
        <p>Best regards,<br>The CITBIF Team</p>
      </div>
    `,
  }),
};

// Send email function
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `${config.email.from.name} <${config.email.from.email}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  const template = emailTemplates.welcome(name);
  return sendEmail(email, template.subject, template.html);
};

// Send email verification
export const sendEmailVerification = async (email: string, name: string, verificationLink: string): Promise<boolean> => {
  const template = emailTemplates.emailVerification(name, verificationLink);
  return sendEmail(email, template.subject, template.html);
};

// Send password reset email
export const sendPasswordResetEmail = async (email: string, name: string, resetLink: string): Promise<boolean> => {
  const template = emailTemplates.passwordReset(name, resetLink);
  return sendEmail(email, template.subject, template.html);
};

// Send application submitted email
export const sendApplicationSubmittedEmail = async (email: string, name: string, applicationType: string): Promise<boolean> => {
  const template = emailTemplates.applicationSubmitted(name, applicationType);
  return sendEmail(email, template.subject, template.html);
};

// Send application approved email
export const sendApplicationApprovedEmail = async (email: string, name: string, applicationType: string): Promise<boolean> => {
  const template = emailTemplates.applicationApproved(name, applicationType);
  return sendEmail(email, template.subject, template.html);
};

// Send event reminder email
export const sendEventReminderEmail = async (
  email: string, 
  name: string, 
  eventTitle: string, 
  eventDate: string, 
  eventTime: string
): Promise<boolean> => {
  const template = emailTemplates.eventReminder(name, eventTitle, eventDate, eventTime);
  return sendEmail(email, template.subject, template.html);
};
