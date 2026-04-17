const express = require('express');
const { body, param, query } = require('express-validator');
const verificationController = require('../controllers/verificationController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create verification request
router.post('/request',
  [
    body('targetIdentityHash')
      .isLength({ min: 64, max: 66 })
      .withMessage('Valid target identity hash is required'),
    body('requiredCredentials')
      .isArray({ min: 1 })
      .withMessage('At least one required credential is needed'),
    body('requiredCredentials.*')
      .isString()
      .withMessage('Required credentials must be strings'),
    body('purpose')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Purpose must be less than 500 characters'),
    body('expiresIn')
      .optional()
      .isInt({ min: 300, max: 86400 })
      .withMessage('Expiration must be between 5 minutes and 24 hours')
  ],
  validate,
  verificationController.createVerificationRequest
);

// Get verification requests for current user
router.get('/requests',
  [
    query('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected', 'expired'])
      .withMessage('Status must be pending, approved, rejected, or expired'),
    query('type')
      .optional()
      .isIn(['sent', 'received'])
      .withMessage('Type must be sent or received'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer')
  ],
  validate,
  verificationController.getVerificationRequests
);

// Process verification request (approve/reject)
router.post('/process/:requestId',
  [
    param('requestId')
      .isMongoId()
      .withMessage('Valid request ID is required'),
    body('approved')
      .isBoolean()
      .withMessage('Approved status must be a boolean'),
    body('zkProof')
      .optional()
      .isString()
      .withMessage('Zero-knowledge proof must be a string'),
    body('sharedCredentials')
      .optional()
      .isArray()
      .withMessage('Shared credentials must be an array')
  ],
  validate,
  verificationController.processVerificationRequest
);

// Get verification details
router.get('/:requestId',
  [
    param('requestId')
      .isMongoId()
      .withMessage('Valid request ID is required')
  ],
  validate,
  verificationController.getVerificationDetails
);

// Get verification history
router.get('/history/stats',
  verificationController.getVerificationStats
);

module.exports = router;
