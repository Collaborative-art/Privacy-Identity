const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  nonce: {
    type: String,
    required: true,
    default: () => Math.floor(Math.random() * 1000000).toString()
  },
  identityHash: {
    type: String,
    sparse: true
  },
  profile: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    avatar: { type: String },
    bio: { type: String, maxlength: 500 }
  },
  reputation: {
    score: { type: Number, default: 100, min: 0, max: 1000 },
    level: { type: String, default: 'Bronze', enum: ['Bronze', 'Silver', 'Gold', 'Platinum'] }
  },
  verification: {
    isVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date },
    verificationLevel: { 
      type: String, 
      default: 'None', 
      enum: ['None', 'Basic', 'Standard', 'Enhanced'] 
    }
  },
  privacy: {
    dataSharing: { type: Boolean, default: false },
    marketingConsent: { type: Boolean, default: false },
    analyticsConsent: { type: Boolean, default: false }
  },
  security: {
    twoFactorEnabled: { type: Boolean, default: false },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date }
  },
  activity: {
    lastActive: { type: Date, default: Date.now },
    totalVerifications: { type: Number, default: 0 },
    successfulVerifications: { type: Number, default: 0 }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.nonce;
      delete ret.security.loginAttempts;
      delete ret.security.lockUntil;
      return ret;
    }
  }
});

// Indexes for performance
userSchema.index({ walletAddress: 1 });
userSchema.index({ email: 1 });
userSchema.index({ identityHash: 1 });
userSchema.index({ 'reputation.score': -1 });
userSchema.index({ 'activity.lastActive': -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.profile.firstName && this.profile.lastName) {
    return `${this.profile.firstName} ${this.profile.lastName}`;
  }
  return this.profile.firstName || this.profile.lastName || '';
});

// Virtual for account age
userSchema.virtual('accountAge').get(function() {
  return Date.now() - this.createdAt.getTime();
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Update last activity
  this.activity.lastActive = new Date();
  
  // Update reputation level based on score
  if (this.reputation.score >= 750) {
    this.reputation.level = 'Platinum';
  } else if (this.reputation.score >= 500) {
    this.reputation.level = 'Gold';
  } else if (this.reputation.score >= 250) {
    this.reputation.level = 'Silver';
  } else {
    this.reputation.level = 'Bronze';
  }

  next();
});

// Instance methods
userSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  delete obj.nonce;
  delete obj.security.loginAttempts;
  delete obj.security.lockUntil;
  return obj;
};

userSchema.methods.isLocked = function() {
  return !!(this.security.lockUntil && this.security.lockUntil > Date.now());
};

userSchema.methods.incrementLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.security.lockUntil && this.security.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { 'security.lockUntil': 1 },
      $set: { 'security.loginAttempts': 1 }
    });
  }
  
  const updates = { $inc: { 'security.loginAttempts': 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.security.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { 'security.lockUntil': Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { 'security.loginAttempts': 1, 'security.lockUntil': 1 },
    $set: { 'security.lastLogin': new Date() }
  });
};

// Static methods
userSchema.statics.findByWalletAddress = function(walletAddress) {
  return this.findOne({ walletAddress: walletAddress.toLowerCase() });
};

userSchema.statics.findByIdentityHash = function(identityHash) {
  return this.findOne({ identityHash });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
