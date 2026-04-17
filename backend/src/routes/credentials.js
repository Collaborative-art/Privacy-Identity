const express = require('express');
const { body, param, query } = require('express-validator');
const credentialController = require('../controllers/credentialController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Create new credential
router.post('/',
  [
    body('type')
      .isIn(['identity', 'education', 'employment', 'financial', 'medical', 'government', 'professional', 'custom'])
      .withMessage('Valid credential type is required'),
    body('title')
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('issuer.name')
      .isLength({ min: 1, max: 100 })
      .withMessage('Issuer name is required'),
    body('data')
      .notEmpty()
      .withMessage('Credential data is required'),
    body('dates.issued')
      .isISO8601()
      .withMessage('Valid issue date is required'),
    body('dates.expires')
      .optional()
      .isISO8601()
      .withMessage('Valid expiration date is required')
  ],
  validate,
  credentialController.createCredential
);

// Get user's credentials
router.get('/',
  [
    query('type')
      .optional()
      .isIn(['identity', 'education', 'employment', 'financial', 'medical', 'government', 'professional', 'custom'])
      .withMessage('Valid credential type is required'),
    query('status')
      .optional()
      .isIn(['active', 'expired', 'revoked', 'suspended'])
      .withMessage('Status must be active, expired, revoked, or suspended'),
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
  credentialController.getCredentials
);

// Get specific credential
router.get('/:credentialId',
  [
    param('credentialId')
      .isMongoId()
      .withMessage('Valid credential ID is required')
  ],
  validate,
  credentialController.getCredential
);

// Update credential
router.put('/:credentialId',
  [
    param('credentialId')
      .isMongoId()
      .withMessage('Valid credential ID is required'),
    body('title')
      .optional()
      .isLength({ min: 1, max: 100 })
      .withMessage('Title must be between 1 and 100 characters'),
    body('description')
      .optional()
      .isLength({ max: 500 })
      .withMessage('Description must be less than 500 characters'),
    body('metadata.tags')
      .optional()
      .isArray()
      .withMessage('Tags must be an array')
  ],
  validate,
  credentialController.updateCredential
);

// Revoke credential
router.delete('/:credentialId',
  [
    param('credentialId')
      .isMongoId()
      .withMessage('Valid credential ID is required')
  ],
  validate,
  credentialController.revokeCredential
);

// Share credential with another user
router.post('/:credentialId/share',
  [
    param('credentialId')
      .isMongoId()
      .withMessage('Valid credential ID is required'),
    body('targetUserId')
      .isMongoId()
      .withMessage('Valid target user ID is required'),
    body('accessLevel')
      .isIn(['view', 'verify', 'admin'])
      .withMessage('Access level must be view, verify, or admin'),
    body('expiresIn')
      .optional()
      .isInt({ min: 3600, max: 31536000 })
      .withMessage('Expiration must be between 1 hour and 1 year')
  ],
  validate,
  credentialController.shareCredential
);

// Revoke credential access
router.delete('/:credentialId/share/:targetUserId',
  [
    param('credentialId')
      .isMongoId()
      .withMessage('Valid credential ID is required'),
    param('targetUserId')
      .isMongoId()
      .withMessage('Valid target user ID is required')
  ],
  validate,
  credentialController.revokeCredentialAccess
);

// Search public credentials
router.get('/public/search',
  [
    query('q')
      .notEmpty()
      .withMessage('Search query is required'),
    query('type')
      .optional()
      .isIn(['identity', 'education', 'employment', 'financial', 'medical', 'government', 'professional', 'custom'])
      .withMessage('Valid credential type is required'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  validate,
  credentialController.searchPublicCredentials
);

// Get credential statistics
router.get('/stats/overview',
  credentialController.getCredentialStats
);

module.exports = router;
