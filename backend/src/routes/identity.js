const express = require('express');
const { body, param, query } = require('express-validator');
const identityController = require('../controllers/identityController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create identity
router.post('/create',
  [
    body('identityData')
      .notEmpty()
      .withMessage('Identity data is required'),
    body('encryptionKey')
      .isLength({ min: 32 })
      .withMessage('Encryption key must be at least 32 characters')
  ],
  validate,
  identityController.createIdentity
);

// Get identity details
router.get('/',
  identityController.getIdentity
);

// Update identity
router.put('/',
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
      .withMessage('Bio must be less than 500 characters')
  ],
  validate,
  identityController.updateIdentity
);

// Get identity by hash (public endpoint)
router.get('/hash/:identityHash',
  [
    param('identityHash')
      .isLength({ min: 64, max: 66 })
      .withMessage('Valid identity hash is required')
  ],
  validate,
  identityController.getIdentityByHash
);

// Search identities
router.get('/search',
  [
    query('q')
      .notEmpty()
      .withMessage('Search query is required'),
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
  identityController.searchIdentities
);

// Get identity statistics
router.get('/stats',
  identityController.getIdentityStats
);

module.exports = router;
