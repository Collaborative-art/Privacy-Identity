const mongoose = require('mongoose');

const credentialSchema = new mongoose.Schema({
  credentialId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'identity',
      'education',
      'employment',
      'financial',
      'medical',
      'government',
      'professional',
      'custom'
    ]
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  issuer: {
    name: { type: String, required: true },
    address: { type: String },
    website: { type: String },
    verificationId: { type: String }
  },
  data: {
    encrypted: { type: String, required: true },
    hash: { type: String, required: true },
    salt: { type: String, required: true }
  },
  metadata: {
    category: { type: String },
    tags: [{ type: String }],
    language: { type: String, default: 'en' }
  },
  verification: {
    zkProof: { type: String },
    merkleRoot: { type: String },
    verificationHash: { type: String }
  },
  dates: {
    issued: { type: Date, required: true },
    expires: { type: Date },
    verified: { type: Date }
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'expired', 'revoked', 'suspended']
  },
  access: {
    isPublic: { type: Boolean, default: false },
    sharedWith: [{ 
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      accessLevel: { 
        type: String, 
        enum: ['view', 'verify', 'admin'], 
        default: 'view' 
      },
      grantedAt: { type: Date, default: Date.now },
      expiresAt: { type: Date }
    }],
    accessCount: { type: Number, default: 0 }
  },
  usage: {
    totalVerifications: { type: Number, default: 0 },
    successfulVerifications: { type: Number, default: 0 },
    lastUsed: { type: Date }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Indexes for performance
credentialSchema.index({ credentialId: 1 });
credentialSchema.index({ userId: 1 });
credentialSchema.index({ type: 1 });
credentialSchema.index({ 'issuer.name': 1 });
credentialSchema.index({ status: 1 });
credentialSchema.index({ 'dates.expires': 1 });
credentialSchema.index({ 'access.isPublic': 1 });

// Virtual for expiration status
credentialSchema.virtual('isExpired').get(function() {
  return this.dates.expires && this.dates.expires < new Date();
});

// Virtual for verification rate
credentialSchema.virtual('verificationRate').get(function() {
  if (this.usage.totalVerifications === 0) return 0;
  return (this.usage.successfulVerifications / this.usage.totalVerifications) * 100;
});

// Pre-save middleware
credentialSchema.pre('save', function(next) {
  // Update status based on expiration
  if (this.isExpired && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

// Instance methods
credentialSchema.methods.canAccess = function(userId, accessLevel = 'view') {
  // Owner has full access
  if (this.userId.toString() === userId.toString()) {
    return true;
  }
  
  // Check public access
  if (this.access.isPublic && accessLevel === 'view') {
    return true;
  }
  
  // Check shared access
  const sharedAccess = this.access.sharedWith.find(
    share => share.userId.toString() === userId.toString()
  );
  
  if (!sharedAccess) return false;
  
  // Check if access has expired
  if (sharedAccess.expiresAt && sharedAccess.expiresAt < new Date()) {
    return false;
  }
  
  // Check access level hierarchy
  const levels = { view: 1, verify: 2, admin: 3 };
  return levels[sharedAccess.accessLevel] >= levels[accessLevel];
};

credentialSchema.methods.grantAccess = function(userId, accessLevel = 'view', expiresIn = null) {
  // Remove existing access
  this.access.sharedWith = this.access.sharedWith.filter(
    share => share.userId.toString() !== userId.toString()
  );
  
  // Add new access
  const access = {
    userId,
    accessLevel,
    grantedAt: new Date()
  };
  
  if (expiresIn) {
    access.expiresAt = new Date(Date.now() + expiresIn);
  }
  
  this.access.sharedWith.push(access);
  return this.save();
};

credentialSchema.methods.revokeAccess = function(userId) {
  this.access.sharedWith = this.access.sharedWith.filter(
    share => share.userId.toString() !== userId.toString()
  );
  return this.save();
};

credentialSchema.methods.recordVerification = function(successful = true) {
  this.usage.totalVerifications += 1;
  if (successful) {
    this.usage.successfulVerifications += 1;
  }
  this.usage.lastUsed = new Date();
  this.access.accessCount += 1;
  return this.save();
};

// Static methods
credentialSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.type) {
    query.type = options.type;
  }
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

credentialSchema.statics.findPublic = function(options = {}) {
  const query = { 'access.isPublic': true, status: 'active' };
  
  if (options.type) {
    query.type = options.type;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

credentialSchema.statics.search = function(searchTerm, userId = null) {
  const query = {
    $or: [
      { title: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { 'issuer.name': { $regex: searchTerm, $options: 'i' } },
      { 'metadata.tags': { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  };
  
  if (userId) {
    query.$and = [
      { $or: [{ userId }, { 'access.isPublic': true }] }
    ];
  } else {
    query['access.isPublic'] = true;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

const Credential = mongoose.model('Credential', credentialSchema);

module.exports = Credential;
