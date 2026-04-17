const express = require('express');
const { body, query } = require('express-validator');
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Get nonce for wallet signature
router.get('/nonce',
  [
    query('walletAddress')
      .isEthereumAddress()
      .withMessage('Valid Ethereum address is required')
  ],
  validate,
  authController.getNonce
);

// Authenticate with signature
router.post('/authenticate',
  [
    body('walletAddress')
      .isEthereumAddress()
      .withMessage('Valid Ethereum address is required'),
    body('signature')
      .isLength({ min: 130, max: 132 })
      .withMessage('Valid signature is required'),
    body('email')
      .optional()
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail()
  ],
  validate,
  authController.authenticate
);

// Refresh token
router.post('/refresh',
  [
    body('token')
      .notEmpty()
      .withMessage('Token is required')
  ],
  validate,
  authController.refreshToken
);

// Logout
router.post('/logout',
  auth,
  authController.logout
);

// Get current user profile
router.get('/profile',
  auth,
  authController.getProfile
);

// Update user profile
router.put('/profile',
  auth,
  [
    body('profile.firstName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name must be between 1 and 50 characters'),
    body('profile.lastName')
      .optional()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name must be between 1 and 50 characters'),
    body('profile.bio')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters'),
    body('privacy.dataSharing')
      .optional()
      .isBoolean()
      .withMessage('Data sharing must be a boolean'),
    body('privacy.marketingConsent')
      .optional()
      .isBoolean()
      .withMessage('Marketing consent must be a boolean'),
    body('privacy.analyticsConsent')
      .optional()
      .isBoolean()
      .withMessage('Analytics consent must be a boolean')
  ],
  validate,
  authController.updateProfile
);

module.exports = router;
