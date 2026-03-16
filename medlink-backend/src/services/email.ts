import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('📧 SMTP Verification Error:', error);
  } else {
    console.log('📧 SMTP Server is ready to take our messages');
  }
});

console.log('📧 Email Service Config:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  from: process.env.FROM_EMAIL,
  passLength: process.env.SMTP_PASS?.length
});

export const sendWelcomeEmail = async (
  email: string,
  name: string,
  patientId: string
): Promise<boolean> => {
  try {
    console.log(`📧 Sending welcome email to: ${email}, Name: ${name}, PatientID: ${patientId}`);
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@medlink.com';

    const mailOptions = {
      from: `"MedLinkID" <${fromEmail}>`,
      to: email,
      subject: 'Welcome to MedLinkID - Your Patient Portal',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px;">
            <h1 style="color: white; margin: 0; text-align: center;">Welcome to MedLinkID!</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9; border-radius: 10px; margin-top: 20px;">
            <p style="font-size: 16px; color: #333;">Dear <strong>${name}</strong>,</p>
            
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              Welcome to MedLinkID - your secure patient portal! We are excited to have you on board.
            </p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
              <p style="margin: 0; font-size: 14px; color: #555;">
                <strong>Your Patient ID:</strong> <span style="font-size: 18px; color: #667eea;">${patientId}</span>
              </p>
            </div>
            
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              With MedLinkID, you can:
            </p>
            
            <ul style="font-size: 14px; color: #555; line-height: 1.8;">
              <li>Securely manage your medical records</li>
              <li>Control hospital access to your health data</li>
              <li>Receive instant notifications about your health</li>
              <li>Grant and revoke access to healthcare providers</li>
            </ul>
            
            <p style="font-size: 14px; color: #555; line-height: 1.6; margin-top: 20px;">
              To login to your portal, use your <strong>Patient ID</strong> and verify via <strong>OTP</strong> sent to your registered phone number.
            </p>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="#" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
                Visit Patient Portal
              </a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              This is an automated message from MedLinkID. Please do not reply to this email.
            </p>
            <p style="font-size: 12px; color: #999;">
              &copy; ${new Date().getFullYear()} MedLinkID. All rights reserved.
            </p>
          </div>
        </div>
      `
    };

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.log(`\n==========================================`);
      console.log(`📧 WELCOME EMAIL (Mock - SMTP not configured)`);
      console.log(`   To: ${email}`);
      console.log(`   Name: ${name}`);
      console.log(`   Patient ID: ${patientId}`);
      console.log(`==========================================\n`);
      return true;
    }

    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent successfully to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Email Error:`, error.message || error);
    return false;
  }
};

export const sendVerificationEmail = async (
  email: string,
  name: string,
  token: string
): Promise<boolean> => {
  try {
    const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@medlink.com';
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"MedLinkID" <${fromEmail}>`,
      to: email,
      subject: 'Verify Your Email - MedLinkID',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px;">
            <h1 style="color: white; margin: 0; text-align: center;">Verify Your Email</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9; border-radius: 10px; margin-top: 20px;">
            <p style="font-size: 16px; color: #333;">Dear <strong>${name}</strong>,</p>
            
            <p style="font-size: 14px; color: #555; line-height: 1.6;">
              Thank you for registering with MedLinkID. Please verify your email address by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; display: inline-block;">
                Verify Email
              </a>
            </div>
            
            <p style="font-size: 12px; color: #999;">
              Or copy and paste this link in your browser:<br>
              ${verificationUrl}
            </p>
            
            <p style="font-size: 12px; color: #999; margin-top: 20px;">
              This verification link will expire in 24 hours.
            </p>
          </div>
        </div>
      `
    };

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      console.log(`\n==========================================`);
      console.log(`📧 VERIFICATION EMAIL (Mock - SMTP not configured)`);
      console.log(`   To: ${email}`);
      console.log(`   Name: ${name}`);
      console.log(`   Token: ${token}`);
      console.log(`   URL: ${verificationUrl}`);
      console.log(`==========================================\n`);
      return true;
    }

    await transporter.sendMail(mailOptions);
    console.log(`✅ Verification email sent successfully to ${email}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Email Error:`, error.message || error);
    return false;
  }
};
