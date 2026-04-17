const crypto = require('crypto');
const { ethers } = require('ethers');

/**
 * Generate a random nonce for authentication
 */
function generateNonce() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Verify Ethereum signature
 * @param {string} message - Original message
 * @param {string} signature - Signature to verify
 * @param {string} address - Expected signer address
 */
function verifySignature(message, signature, address) {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    return false;
  }
}

/**
 * Encrypt data using AES-256-GCM
 * @param {string} text - Text to encrypt
 * @param {string} key - Encryption key (32 bytes for AES-256)
 */
function encrypt(text, key) {
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  } catch (error) {
    throw new Error('Encryption failed: ' + error.message);
  }
}

/**
 * Decrypt data using AES-256-GCM
 * @param {Object} encryptedData - Encrypted data object
 * @param {string} key - Decryption key
 */
function decrypt(encryptedData, key) {
  try {
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: ' + error.message);
  }
}

/**
 * Generate SHA-256 hash
 * @param {string} data - Data to hash
 */
function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate Merkle tree root from array of hashes
 * @param {string[]} hashes - Array of hash strings
 */
function generateMerkleRoot(hashes) {
  if (hashes.length === 0) return '';
  if (hashes.length === 1) return hashes[0];

  const nextLevel = [];
  for (let i = 0; i < hashes.length; i += 2) {
    const left = hashes[i];
    const right = hashes[i + 1] || left; // Duplicate last element if odd number
    const combined = left + right;
    nextLevel.push(hash(combined));
  }

  return generateMerkleRoot(nextLevel);
}

/**
 * Generate Merkle proof for a specific leaf
 * @param {string[]} hashes - Original array of hashes
 * @param {number} index - Index of the leaf to prove
 */
function generateMerkleProof(hashes, index) {
  const proof = [];
  let currentLevel = hashes;

  while (currentLevel.length > 1) {
    const nextLevel = [];
    
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left;
      
      if (i === index || (i + 1 === index && currentLevel.length % 2 === 1)) {
        // Add sibling to proof
        if (i === index) {
          proof.push(currentLevel[i + 1] || left);
          index = Math.floor(i / 2);
        } else {
          proof.push(left);
          index = Math.floor(i / 2);
        }
      }
      
      const combined = left + right;
      nextLevel.push(hash(combined));
    }
    
    currentLevel = nextLevel;
  }

  return proof;
}

/**
 * Verify Merkle proof
 * @param {string} leaf - Leaf hash
 * @param {string[]} proof - Merkle proof array
 * @param {string} root - Merkle root
 * @param {number} index - Index of the leaf
 */
function verifyMerkleProof(leaf, proof, root, index) {
  let computedHash = leaf;

  for (let i = 0; i < proof.length; i++) {
    if (index % 2 === 0) {
      computedHash = hash(computedHash + proof[i]);
    } else {
      computedHash = hash(proof[i] + computedHash);
    }
    index = Math.floor(index / 2);
  }

  return computedHash === root;
}

/**
 * Generate a deterministic key from user data
 * @param {string} userId - User ID
 * @param {string} salt - Salt value
 */
function deriveKey(userId, salt) {
  return crypto.pbkdf2Sync(userId, salt, 100000, 32, 'sha256').toString('hex');
}

/**
 * Generate random encryption key
 */
function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate salt for key derivation
 */
function generateSalt() {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Create HMAC for message authentication
 * @param {string} message - Message to authenticate
 * @param {string} key - HMAC key
 */
function createHMAC(message, key) {
  return crypto.createHmac('sha256', key).update(message).digest('hex');
}

/**
 * Verify HMAC
 * @param {string} message - Original message
 * @param {string} hmac - HMAC to verify
 * @param {string} key - HMAC key
 */
function verifyHMAC(message, hmac, key) {
  const expectedHMAC = createHMAC(message, key);
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHMAC));
}

module.exports = {
  generateNonce,
  verifySignature,
  encrypt,
  decrypt,
  hash,
  generateMerkleRoot,
  generateMerkleProof,
  verifyMerkleProof,
  deriveKey,
  generateEncryptionKey,
  generateSalt,
  createHMAC,
  verifyHMAC
};
