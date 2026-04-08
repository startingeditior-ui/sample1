const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

const sendSMS = async (to, message) => {
  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: to
    });
    console.log(`[Twilio] SMS sent successfully: ${result.sid}`);
    return { success: true, sid: result.sid };
  } catch (error) {
    console.error(`[Twilio] Failed to send SMS:`, error.message);
    return { success: false, error: error.message };
  }
};

const sendOTP = async (phoneNumber, otp) => {
  // In demo mode, OTP is handled by the caller for logging if needed
  // Production: OTP sent via Twilio API
  const message = `Your MedLinkID verification code is: ${otp}. This code expires in 10 minutes.`;
  return await sendSMS(phoneNumber, message);
};

module.exports = {
  sendSMS,
  sendOTP
};