const crypto = require('crypto');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const hashOTP = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex');
};

const verifyOTP = (inputOTP, storedHash) => {
  const inputHash = hashOTP(inputOTP);
  return inputHash === storedHash;
};

const OTP_EXPIRY_MINUTES = 10;

const getOTPExpiry = () => {
  return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
};

const getRemainingSeconds = (expiresAt) => {
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry - now;
  return Math.max(0, Math.floor(diff / 1000));
};

module.exports = {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiry,
  getRemainingSeconds,
  OTP_EXPIRY_MINUTES
};
