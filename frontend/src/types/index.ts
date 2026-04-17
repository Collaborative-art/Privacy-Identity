// User and Authentication Types
export interface User {
  _id: string;
  walletAddress: string;
  email: string;
  identityHash?: string;
  profile: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
    bio?: string;
  };
  reputation: {
    score: number;
    level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  };
  verification: {
    isVerified: boolean;
    verifiedAt?: string;
    verificationLevel: 'None' | 'Basic' | 'Standard' | 'Enhanced';
  };
  privacy: {
    dataSharing: boolean;
    marketingConsent: boolean;
    analyticsConsent: boolean;
  };
  activity: {
    lastActive: string;
    totalVerifications: number;
    successfulVerifications: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginRequest {
  walletAddress: string;
  signature: string;
  email?: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    token: string;
    user: User;
  };
}

// Credential Types
export interface Credential {
  _id: string;
  credentialId: string;
  userId: string;
  type: 'identity' | 'education' | 'employment' | 'financial' | 'medical' | 'government' | 'professional' | 'custom';
  title: string;
  description?: string;
  issuer: {
    name: string;
    address?: string;
    website?: string;
    verificationId?: string;
  };
  data: {
    encrypted: string;
    hash: string;
    salt: string;
  };
  metadata: {
    category?: string;
    tags: string[];
    language: string;
  };
  verification: {
    zkProof?: string;
    merkleRoot?: string;
    verificationHash?: string;
  };
  dates: {
    issued: string;
    expires?: string;
    verified?: string;
  };
  status: 'active' | 'expired' | 'revoked' | 'suspended';
  access: {
    isPublic: boolean;
    sharedWith: Array<{
      userId: string;
      accessLevel: 'view' | 'verify' | 'admin';
      grantedAt: string;
      expiresAt?: string;
    }>;
    accessCount: number;
  };
  usage: {
    totalVerifications: number;
    successfulVerifications: number;
    lastUsed?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCredentialRequest {
  type: Credential['type'];
  title: string;
  description?: string;
  issuer: {
    name: string;
    address?: string;
    website?: string;
    verificationId?: string;
  };
  data: any; // Will be encrypted on frontend
  dates: {
    issued: string;
    expires?: string;
  };
  metadata?: {
    category?: string;
    tags?: string[];
    language?: string;
  };
}

// Verification Types
export interface VerificationRequest {
  _id: string;
  requestId: string;
  requester: string;
  targetIdentityHash: string;
  requiredCredentials: string[];
  purpose?: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: string;
  expiresAt: string;
  processedAt?: string;
  processedBy?: string;
  zkProof?: string;
  sharedCredentials?: string[];
}

export interface CreateVerificationRequest {
  targetIdentityHash: string;
  requiredCredentials: string[];
  purpose?: string;
  expiresIn?: number;
}

export interface ProcessVerificationRequest {
  approved: boolean;
  zkProof?: string;
  sharedCredentials?: string[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Array<{
    field: string;
    message: string;
    value?: any;
  }>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Blockchain Types
export interface ContractConfig {
  address: string;
  abi: any[];
}

export interface BlockchainTransaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  blockNumber: number;
  timestamp: number;
  status: number;
}

// UI Component Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    custom?: (value: any) => string | undefined;
  };
  options?: Array<{
    value: string;
    label: string;
  }>;
}

// Search and Filter Types
export interface SearchFilters {
  query?: string;
  type?: string;
  status?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// Statistics Types
export interface IdentityStats {
  totalIdentities: number;
  activeIdentities: number;
  verifiedIdentities: number;
  newIdentitiesThisMonth: number;
  averageReputationScore: number;
}

export interface CredentialStats {
  totalCredentials: number;
  activeCredentials: number;
  expiredCredentials: number;
  revokedCredentials: number;
  credentialsByType: Record<string, number>;
}

export interface VerificationStats {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  averageProcessingTime: number;
  successRate: number;
}

// Error Types
export interface AppError {
  code: string;
  message: string;
  details?: any;
}

// Event Types
export interface WebSocketEvent {
  type: string;
  payload: any;
  timestamp: string;
}

// Utility Types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
