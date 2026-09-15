const { validationResult, body, param } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

// Auth validation rules
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s'-]+$/)
    .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes'),
  body('age')
    .isInt({ min: 18, max: 100 })
    .withMessage('Age must be between 18 and 100'),
  body('gender')
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  handleValidationErrors
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Message validation rules
const sendMessageValidation = [
  body('content')
    .optional()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Message content must be between 1 and 5000 characters'),
  body('type')
    .optional()
    .isIn(['text', 'image', 'video'])
    .withMessage('Message type must be text, image, or video'),
  body('mediaUrl')
    .optional()
    .isURL()
    .withMessage('Media URL must be a valid URL'),
  handleValidationErrors
];

const matchIdValidation = [
  param('matchId')
    .isInt({ min: 1 })
    .withMessage('Match ID must be a positive integer'),
  handleValidationErrors
];

// Profile validation rules
const profileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('age')
    .optional()
    .isInt({ min: 18, max: 100 })
    .withMessage('Age must be between 18 and 100'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must be 500 characters or less'),
  body('interests')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Interests must be an array with max 20 items'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  sendMessageValidation,
  matchIdValidation,
  profileValidation,
  handleValidationErrors
};
