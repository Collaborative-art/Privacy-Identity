// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title XRayIdentity
 * @dev The X-Ray Protocol Identity Management Contract
 * @notice Manages decentralized identities with privacy-preserving verification
 */
contract XRayIdentity is Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct Identity {
        address owner;
        bytes32 identityHash;
        uint256 createdAt;
        uint256 lastUpdated;
        bool isActive;
        uint256 reputationScore;
        mapping(bytes32 => Credential) credentials;
        bytes32[] credentialIds;
    }

    struct Credential {
        bytes32 id;
        string credentialType;
        bytes32 dataHash;
        uint256 issuedAt;
        uint256 expiresAt;
        bool isRevoked;
        address issuer;
        bytes32 zkProof;
    }

    struct VerificationRequest {
        bytes32 requestId;
        address requester;
        bytes32 identityHash;
        bytes32[] requiredCredentials;
        uint256 timestamp;
        bool isProcessed;
        bool isApproved;
    }

    mapping(address => Identity) public identities;
    mapping(bytes32 => address) public identityToOwner;
    mapping(bytes32 => VerificationRequest) public verificationRequests;
    mapping(address => bool) public authorizedIssuers;

    uint256 public totalIdentities;
    uint256 public totalVerifications;
    uint256 private _nonce;

    event IdentityCreated(
        address indexed owner,
        bytes32 indexed identityHash,
        uint256 timestamp
    );

    event CredentialAdded(
        bytes32 indexed identityHash,
        bytes32 indexed credentialId,
        string credentialType,
        address issuer
    );

    event CredentialRevoked(
        bytes32 indexed identityHash,
        bytes32 indexed credentialId,
        uint256 timestamp
    );

    event VerificationRequested(
        bytes32 indexed requestId,
        address indexed requester,
        bytes32 indexed identityHash
    );

    event VerificationCompleted(
        bytes32 indexed requestId,
        bool approved,
        uint256 timestamp
    );

    event ReputationUpdated(
        bytes32 indexed identityHash,
        uint256 newScore,
        uint256 timestamp
    );

    modifier onlyIdentityOwner(bytes32 identityHash) {
        require(
            identityToOwner[identityHash] == msg.sender,
            "XRayIdentity: Not the identity owner"
        );
        _;
    }

    modifier onlyAuthorizedIssuer() {
        require(
            authorizedIssuers[msg.sender],
            "XRayIdentity: Not an authorized issuer"
        );
        _;
    }

    modifier validIdentity(bytes32 identityHash) {
        require(
            identityToOwner[identityHash] != address(0),
            "XRayIdentity: Identity does not exist"
        );
        require(
            identities[identityToOwner[identityHash]].isActive,
            "XRayIdentity: Identity is not active"
        );
        _;
    }

    constructor() Ownable(msg.sender) {
        authorizedIssuers[msg.sender] = true;
    }

    /**
     * @dev Creates a new decentralized identity
     * @param identityData Encrypted identity data hash
     */
    function createIdentity(bytes32 identityData) external whenNotPaused nonReentrant {
        require(
            identities[msg.sender].owner == address(0),
            "XRayIdentity: Identity already exists"
        );

        bytes32 identityHash = keccak256(
            abi.encodePacked(msg.sender, identityData, block.timestamp, _nonce++)
        );

        Identity storage identity = identities[msg.sender];
        identity.owner = msg.sender;
        identity.identityHash = identityHash;
        identity.createdAt = block.timestamp;
        identity.lastUpdated = block.timestamp;
        identity.isActive = true;
        identity.reputationScore = 100; // Start with neutral reputation

        identityToOwner[identityHash] = msg.sender;
        totalIdentities++;

        emit IdentityCreated(msg.sender, identityHash, block.timestamp);
    }

    /**
     * @dev Adds a credential to an identity
     * @param identityHash Target identity hash
     * @param credentialType Type of credential
     * @param dataHash Hash of credential data
     * @param expiresAt Expiration timestamp
     * @param zkProof Zero-knowledge proof for privacy
     */
    function addCredential(
        bytes32 identityHash,
        string memory credentialType,
        bytes32 dataHash,
        uint256 expiresAt,
        bytes32 zkProof
    ) external onlyAuthorizedIssuer validIdentity(identityHash) nonReentrant {
        require(expiresAt > block.timestamp, "XRayIdentity: Credential already expired");

        bytes32 credentialId = keccak256(
            abi.encodePacked(identityHash, credentialType, dataHash, block.timestamp)
        );

        Identity storage identity = identities[identityToOwner[identityHash]];
        
        require(
            identity.credentials[credentialId].issuer == address(0),
            "XRayIdentity: Credential already exists"
        );

        Credential storage credential = identity.credentials[credentialId];
        credential.id = credentialId;
        credential.credentialType = credentialType;
        credential.dataHash = dataHash;
        credential.issuedAt = block.timestamp;
        credential.expiresAt = expiresAt;
        credential.isRevoked = false;
        credential.issuer = msg.sender;
        credential.zkProof = zkProof;

        identity.credentialIds.push(credentialId);
        identity.lastUpdated = block.timestamp;

        emit CredentialAdded(identityHash, credentialId, credentialType, msg.sender);
    }

    /**
     * @dev Revokes a credential
     * @param identityHash Target identity hash
     * @param credentialId Credential ID to revoke
     */
    function revokeCredential(
        bytes32 identityHash,
        bytes32 credentialId
    ) external onlyIdentityOwner(identityHash) nonReentrant {
        Identity storage identity = identities[identityToOwner[identityHash]];
        Credential storage credential = identity.credentials[credentialId];
        
        require(
            credential.issuer != address(0),
            "XRayIdentity: Credential does not exist"
        );
        require(!credential.isRevoked, "XRayIdentity: Credential already revoked");

        credential.isRevoked = true;
        identity.lastUpdated = block.timestamp;

        emit CredentialRevoked(identityHash, credentialId, block.timestamp);
    }

    /**
     * @dev Requests identity verification
     * @param identityHash Target identity hash
     * @param requiredCredentials List of required credential types
     */
    function requestVerification(
        bytes32 identityHash,
        string[] memory requiredCredentials
    ) external whenNotPaused nonReentrant returns (bytes32) {
        bytes32[] memory credentialHashes = new bytes32[](requiredCredentials.length);
        
        for (uint256 i = 0; i < requiredCredentials.length; i++) {
            credentialHashes[i] = keccak256(abi.encodePacked(requiredCredentials[i]));
        }

        bytes32 requestId = keccak256(
            abi.encodePacked(
                msg.sender,
                identityHash,
                block.timestamp,
                _nonce++
            )
        );

        VerificationRequest storage request = verificationRequests[requestId];
        request.requestId = requestId;
        request.requester = msg.sender;
        request.identityHash = identityHash;
        request.requiredCredentials = credentialHashes;
        request.timestamp = block.timestamp;
        request.isProcessed = false;

        totalVerifications++;

        emit VerificationRequested(requestId, msg.sender, identityHash);
        return requestId;
    }

    /**
     * @dev Processes a verification request with zero-knowledge proof
     * @param requestId Verification request ID
     * @param approved Whether verification is approved
     * @param zkProof Zero-knowledge proof for verification
     * @param signature Signature from identity owner
     */
    function processVerification(
        bytes32 requestId,
        bool approved,
        bytes32 zkProof,
        bytes memory signature
    ) external onlyIdentityOwner(verificationRequests[requestId].identityHash) nonReentrant {
        VerificationRequest storage request = verificationRequests[requestId];
        
        require(!request.isProcessed, "XRayIdentity: Request already processed");
        require(
            block.timestamp <= request.timestamp + 24 hours,
            "XRayIdentity: Request expired"
        );

        // Verify signature from identity owner
        bytes32 messageHash = keccak256(
            abi.encodePacked(requestId, approved, zkProof)
        ).toEthSignedMessageHash();
        
        address signer = messageHash.recover(signature);
        require(signer == msg.sender, "XRayIdentity: Invalid signature");

        request.isProcessed = true;
        request.isApproved = approved;

        // Update reputation based on verification outcome
        if (approved) {
            _updateReputation(request.identityHash, 5);
        } else {
            _updateReputation(request.identityHash, -2);
        }

        emit VerificationCompleted(requestId, approved, block.timestamp);
    }

    /**
     * @dev Updates identity reputation score
     * @param identityHash Target identity hash
     * @param scoreChange Change in reputation score
     */
    function _updateReputation(bytes32 identityHash, int256 scoreChange) internal {
        Identity storage identity = identities[identityToOwner[identityHash]];
        
        if (scoreChange > 0) {
            identity.reputationScore += uint256(scoreChange);
        } else if (scoreChange < 0 && identity.reputationScore > uint256(-scoreChange)) {
            identity.reputationScore -= uint256(-scoreChange);
        }

        emit ReputationUpdated(identityHash, identity.reputationScore, block.timestamp);
    }

    /**
     * @dev Authorizes an issuer to add credentials
     * @param issuer Address to authorize
     */
    function authorizeIssuer(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = true;
    }

    /**
     * @dev Revokes issuer authorization
     * @param issuer Address to revoke
     */
    function revokeIssuerAuthorization(address issuer) external onlyOwner {
        authorizedIssuers[issuer] = false;
    }

    /**
     * @dev Pauses the contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Gets identity information
     * @param user Address of the identity owner
     */
    function getIdentity(address user) external view returns (
        bytes32 identityHash,
        uint256 createdAt,
        uint256 lastUpdated,
        bool isActive,
        uint256 reputationScore,
        uint256 credentialCount
    ) {
        Identity storage identity = identities[user];
        return (
            identity.identityHash,
            identity.createdAt,
            identity.lastUpdated,
            identity.isActive,
            identity.reputationScore,
            identity.credentialIds.length
        );
    }

    /**
     * @dev Gets credential information
     * @param user Address of the identity owner
     * @param credentialId Credential ID
     */
    function getCredential(address user, bytes32 credentialId) external view returns (
        string memory credentialType,
        bytes32 dataHash,
        uint256 issuedAt,
        uint256 expiresAt,
        bool isRevoked,
        address issuer
    ) {
        Credential storage credential = identities[user].credentials[credentialId];
        return (
            credential.credentialType,
            credential.dataHash,
            credential.issuedAt,
            credential.expiresAt,
            credential.isRevoked,
            credential.issuer
        );
    }

    /**
     * @dev Gets all credential IDs for an identity
     * @param user Address of the identity owner
     */
    function getCredentials(address user) external view returns (bytes32[] memory) {
        return identities[user].credentialIds;
    }

    /**
     * @dev Checks if an address has an active identity
     * @param user Address to check
     */
    function hasIdentity(address user) external view returns (bool) {
        return identities[user].owner != address(0) && identities[user].isActive;
    }
}
