const { body, param, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

const phoneValidation = body('phoneNumber')
  .optional()
  .matches(/^\+?[1-9]\d{1,14}$/)
  .withMessage('Invalid phone number format');

const otpValidation = body('otp')
  .optional()
  .isLength({ min: 6, max: 6 })
  .isNumeric()
  .withMessage('OTP must be 6 digits');

const recordIdValidation = param('recordId')
  .optional()
  .isUUID()
  .withMessage('Invalid record ID format');

const patientIdValidation = body('patientId')
  .optional()
  .isUUID()
  .withMessage('Invalid patient ID format');

const passwordValidation = body('password')
  .optional()
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters');

module.exports = {
  validate,
  phoneValidation,
  otpValidation,
  recordIdValidation,
  patientIdValidation,
  passwordValidation
};