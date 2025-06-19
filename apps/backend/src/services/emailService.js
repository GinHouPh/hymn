"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@hymnalapp.com';
if (SENDGRID_API_KEY) {
    mail_1.default.setApiKey(SENDGRID_API_KEY);
}
class EmailService {
    static sendEmail(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!SENDGRID_API_KEY) {
                console.warn('SendGrid API key not configured. Email not sent.');
                return;
            }
            try {
                const msg = {
                    to: options.to,
                    from: FROM_EMAIL,
                    subject: options.subject,
                    text: options.text,
                    html: options.html,
                };
                yield mail_1.default.send(msg);
                console.log(`Email sent successfully to ${options.to}`);
            }
            catch (error) {
                console.error('Error sending email:', error);
                throw new Error('Failed to send email');
            }
        });
    }
    static sendVerificationEmail(email, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
            const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Verify Your Email - Hymnal App</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4f46e5; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Hymnal App!</h1>
          </div>
          <div class="content">
            <h2>Verify Your Email Address</h2>
            <p>Thank you for registering with Hymnal App. To complete your registration, please verify your email address by clicking the button below:</p>
            <a href="${verificationUrl}" class="button">Verify Email Address</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${verificationUrl}">${verificationUrl}</a></p>
            <p>This verification link will expire in 24 hours.</p>
            <p>If you didn't create an account with Hymnal App, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2024 Hymnal App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
            const text = `
      Welcome to Hymnal App!
      
      Please verify your email address by visiting this link:
      ${verificationUrl}
      
      This verification link will expire in 24 hours.
      
      If you didn't create an account with Hymnal App, please ignore this email.
    `;
            yield this.sendEmail({
                to: email,
                subject: 'Verify Your Email - Hymnal App',
                html,
                text,
            });
        });
    }
    static sendPasswordResetEmail(email, token) {
        return __awaiter(this, void 0, void 0, function* () {
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
            const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reset Your Password - Hymnal App</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #dc2626; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background-color: #f9f9f9; }
          .button { display: inline-block; padding: 12px 24px; background-color: #dc2626; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <h2>Reset Your Password</h2>
            <p>We received a request to reset your password for your Hymnal App account. Click the button below to reset your password:</p>
            <a href="${resetUrl}" class="button">Reset Password</a>
            <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p><a href="${resetUrl}">${resetUrl}</a></p>
            <p>This password reset link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, please ignore this email. Your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© 2024 Hymnal App. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
            const text = `
      Password Reset Request
      
      We received a request to reset your password for your Hymnal App account.
      
      Please reset your password by visiting this link:
      ${resetUrl}
      
      This password reset link will expire in 1 hour.
      
      If you didn't request a password reset, please ignore this email.
    `;
            yield this.sendEmail({
                to: email,
                subject: 'Reset Your Password - Hymnal App',
                html,
                text,
            });
        });
    }
}
exports.EmailService = EmailService;
