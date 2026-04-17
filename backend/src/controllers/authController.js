const { ethers } = require('ethers');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { generateNonce, verifySignature } = require('../utils/crypto');

class AuthController {
  // Generate nonce for wallet signature
  async getNonce(req, res) {
    try {
      const { walletAddress } = req.query;

      if (!walletAddress || !ethers.isAddress(walletAddress)) {
        return res.status(400).json({
          success: false,
          message: 'Valid wallet address is required'
        });
      }

      let user = await User.findByWalletAddress(walletAddress);

      if (!user) {
        // Create new user with nonce
        const nonce = generateNonce();
        user = new User({
          walletAddress: walletAddress.toLowerCase(),
          email: `${walletAddress.toLowerCase()}@temp.xray.protocol`,
          nonce
        });
        await user.save();
        logger.info(`New user created: ${walletAddress}`);
      } else {
        // Generate new nonce for existing user
        user.nonce = generateNonce();
        await user.save();
      }

      res.json({
        success: true,
        data: {
          nonce: user.nonce,
          message: `Sign this message to authenticate: ${user.nonce}`
        }
      });
    } catch (error) {
      logger.error('Error generating nonce:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Authenticate user with signature
  async authenticate(req, res) {
    try {
      const { walletAddress, signature, email } = req.body;

      if (!walletAddress || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Wallet address and signature are required'
        });
      }

      if (!ethers.isAddress(walletAddress)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid wallet address'
        });
      }

      const user = await User.findByWalletAddress(walletAddress);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found. Please request a nonce first.'
        });
      }

      // Check if account is locked
      if (user.isLocked()) {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to multiple failed attempts'
        });
      }

      // Verify signature
      const message = `Sign this message to authenticate: ${user.nonce}`;
      const isValidSignature = verifySignature(message, signature, walletAddress);

      if (!isValidSignature) {
        await user.incrementLoginAttempts();
        return res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
      }

      // Reset login attempts and update email if provided
      if (email && email !== user.email) {
        user.email = email;
      }
      await user.resetLoginAttempts();

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          walletAddress: user.walletAddress,
          identityHash: user.identityHash 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      logger.info(`User authenticated: ${walletAddress}`);

      res.json({
        success: true,
        data: {
          token,
          user: user.toSafeObject()
        }
      });
    } catch (error) {
      logger.error('Authentication error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Refresh token
  async refreshToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token or user not found'
        });
      }

      // Generate new token
      const newToken = jwt.sign(
        { 
          userId: user._id, 
          walletAddress: user.walletAddress,
          identityHash: user.identityHash 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      res.json({
        success: true,
        data: {
          token: newToken,
          user: user.toSafeObject()
        }
      });
    } catch (error) {
      logger.error('Token refresh error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  }

  // Logout (client-side token removal)
  async logout(req, res) {
    try {
      // In a stateless JWT implementation, logout is handled client-side
      // However, we can log the activity and potentially implement token blacklisting
      logger.info(`User logged out: ${req.user.walletAddress}`);
      
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get current user profile
  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: {
          user: user.toSafeObject()
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user profile
  async updateProfile(req, res) {
    try {
      const { profile, privacy } = req.body;
      const user = await User.findById(req.user.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Update profile
      if (profile) {
        if (profile.firstName) user.profile.firstName = profile.firstName;
        if (profile.lastName) user.profile.lastName = profile.lastName;
        if (profile.bio) user.profile.bio = profile.bio;
        if (profile.avatar) user.profile.avatar = profile.avatar;
      }

      // Update privacy settings
      if (privacy) {
        if (privacy.dataSharing !== undefined) user.privacy.dataSharing = privacy.dataSharing;
        if (privacy.marketingConsent !== undefined) user.privacy.marketingConsent = privacy.marketingConsent;
        if (privacy.analyticsConsent !== undefined) user.privacy.analyticsConsent = privacy.analyticsConsent;
      }

      await user.save();

      logger.info(`Profile updated: ${user.walletAddress}`);

      res.json({
        success: true,
        data: {
          user: user.toSafeObject()
        }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();
