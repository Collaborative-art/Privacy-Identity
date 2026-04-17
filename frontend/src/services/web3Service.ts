import { ethers } from 'ethers'
import { ContractConfig, BlockchainTransaction } from '@/types'

// X-Ray Identity Contract ABI (simplified version)
const XRAY_IDENTITY_ABI = [
  'function createIdentity(bytes32 identityData) external',
  'function addCredential(bytes32 identityHash, string memory credentialType, bytes32 dataHash, uint256 expiresAt, bytes32 zkProof) external',
  'function revokeCredential(bytes32 identityHash, bytes32 credentialId) external',
  'function requestVerification(bytes32 identityHash, string[] memory requiredCredentials) external returns (bytes32)',
  'function processVerification(bytes32 requestId, bool approved, bytes32 zkProof, bytes memory signature) external',
  'function getIdentity(address user) external view returns (bytes32 identityHash, uint256 createdAt, uint256 lastUpdated, bool isActive, uint256 reputationScore, uint256 credentialCount)',
  'function getCredential(address user, bytes32 credentialId) external view returns (string memory credentialType, bytes32 dataHash, uint256 issuedAt, uint256 expiresAt, bool isRevoked, address issuer)',
  'function getCredentials(address user) external view returns (bytes32[] memory)',
  'function hasIdentity(address user) external view returns (bool)',
  'function totalIdentities() external view returns (uint256)',
  'function totalVerifications() external view returns (uint256)',
]

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null
  private signer: ethers.JsonRpcSigner | null = null
  private contract: ethers.Contract | null = null

  constructor() {
    this.initializeProvider()
  }

  private async initializeProvider() {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        this.provider = new ethers.BrowserProvider(window.ethereum)
        this.signer = await this.provider.getSigner()
      } catch (error) {
        console.error('Failed to initialize Web3 provider:', error)
      }
    }
  }

  // Connect to wallet
  async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    try {
      await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      this.provider = new ethers.BrowserProvider(window.ethereum)
      this.signer = await this.provider.getSigner()
      const address = await this.signer.getAddress()

      return address
    } catch (error) {
      throw new Error('Failed to connect wallet')
    }
  }

  // Get current account
  async getCurrentAccount(): Promise<string | null> {
    if (!this.signer) {
      await this.initializeProvider()
      if (!this.signer) return null
    }

    try {
      return await this.signer.getAddress()
    } catch (error) {
      return null
    }
  }

  // Get current chain ID
  async getChainId(): Promise<number | null> {
    if (!this.provider) return null

    try {
      const network = await this.provider.getNetwork()
      return Number(network.chainId)
    } catch (error) {
      return null
    }
  }

  // Sign message
  async signMessage(message: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected')
    }

    return await this.signer.signMessage(message)
  }

  // Initialize contract
  initializeContract(contractAddress: string) {
    if (!this.signer) {
      throw new Error('Wallet not connected')
    }

    this.contract = new ethers.Contract(
      contractAddress,
      XRAY_IDENTITY_ABI,
      this.signer
    )
  }

  // Create identity on blockchain
  async createIdentity(identityData: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      const identityHash = ethers.keccak256(ethers.toUtf8Bytes(identityData))
      const tx = await this.contract.createIdentity(identityHash)
      const receipt = await tx.wait()
      
      return receipt.hash
    } catch (error) {
      throw new Error(`Failed to create identity: ${error}`)
    }
  }

  // Add credential to identity
  async addCredential(
    identityHash: string,
    credentialType: string,
    dataHash: string,
    expiresAt: number,
    zkProof: string
  ): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      const tx = await this.contract.addCredential(
        identityHash,
        credentialType,
        dataHash,
        expiresAt,
        zkProof
      )
      const receipt = await tx.wait()
      
      return receipt.hash
    } catch (error) {
      throw new Error(`Failed to add credential: ${error}`)
    }
  }

  // Revoke credential
  async revokeCredential(identityHash: string, credentialId: string): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      const tx = await this.contract.revokeCredential(identityHash, credentialId)
      const receipt = await tx.wait()
      
      return receipt.hash
    } catch (error) {
      throw new Error(`Failed to revoke credential: ${error}`)
    }
  }

  // Request verification
  async requestVerification(
    identityHash: string,
    requiredCredentials: string[]
  ): Promise<{ requestId: string; txHash: string }> {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      const tx = await this.contract.requestVerification(identityHash, requiredCredentials)
      const receipt = await tx.wait()
      
      // Get the request ID from events (simplified)
      const requestId = ethers.keccak256(ethers.solidityPacked(
        ['address', 'bytes32', 'uint256'],
        [await this.signer!.getAddress(), identityHash, Date.now()]
      ))
      
      return { requestId, txHash: receipt.hash }
    } catch (error) {
      throw new Error(`Failed to request verification: ${error}`)
    }
  }

  // Process verification
  async processVerification(
    requestId: string,
    approved: boolean,
    zkProof: string,
    signature: string
  ): Promise<string> {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      const tx = await this.contract.processVerification(
        requestId,
        approved,
        zkProof,
        signature
      )
      const receipt = await tx.wait()
      
      return receipt.hash
    } catch (error) {
      throw new Error(`Failed to process verification: ${error}`)
    }
  }

  // Get identity from blockchain
  async getIdentity(userAddress: string) {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      const identity = await this.contract.getIdentity(userAddress)
      return {
        identityHash: identity.identityHash,
        createdAt: Number(identity.createdAt),
        lastUpdated: Number(identity.lastUpdated),
        isActive: identity.isActive,
        reputationScore: Number(identity.reputationScore),
        credentialCount: Number(identity.credentialCount),
      }
    } catch (error) {
      throw new Error(`Failed to get identity: ${error}`)
    }
  }

  // Get credentials from blockchain
  async getCredentials(userAddress: string): Promise<string[]> {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      const credentials = await this.contract.getCredentials(userAddress)
      return credentials.map((cred: any) => cred.toString())
    } catch (error) {
      throw new Error(`Failed to get credentials: ${error}`)
    }
  }

  // Check if user has identity
  async hasIdentity(userAddress: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      return await this.contract.hasIdentity(userAddress)
    } catch (error) {
      return false
    }
  }

  // Get contract statistics
  async getContractStats() {
    if (!this.contract) {
      throw new Error('Contract not initialized')
    }

    try {
      const [totalIdentities, totalVerifications] = await Promise.all([
        this.contract.totalIdentities(),
        this.contract.totalVerifications(),
      ])

      return {
        totalIdentities: Number(totalIdentities),
        totalVerifications: Number(totalVerifications),
      }
    } catch (error) {
      throw new Error(`Failed to get contract stats: ${error}`)
    }
  }

  // Send transaction
  async sendTransaction(to: string, value: string, data?: string): Promise<string> {
    if (!this.signer) {
      throw new Error('Wallet not connected')
    }

    try {
      const tx = await this.signer.sendTransaction({
        to,
        value: ethers.parseEther(value),
        data: data || '0x',
      })
      
      const receipt = await tx.wait()
      return receipt.hash
    } catch (error) {
      throw new Error(`Failed to send transaction: ${error}`)
    }
  }

  // Get transaction receipt
  async getTransactionReceipt(txHash: string): Promise<BlockchainTransaction | null> {
    if (!this.provider) {
      throw new Error('Provider not initialized')
    }

    try {
      const receipt = await this.provider.getTransactionReceipt(txHash)
      const tx = await this.provider.getTransaction(txHash)

      if (!receipt || !tx) return null

      return {
        hash: receipt.hash,
        from: receipt.from,
        to: receipt.to || '',
        value: ethers.formatEther(tx.value),
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: tx.gasPrice ? ethers.formatUnits(tx.gasPrice, 'gwei') : '0',
        blockNumber: receipt.blockNumber,
        timestamp: Date.now(), // Would need to fetch block timestamp for accuracy
        status: receipt.status || 0,
      }
    } catch (error) {
      return null
    }
  }

  // Switch network
  async switchNetwork(chainId: number): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not found, try to add it
        await this.addNetwork(chainId)
      } else {
        throw new Error('Failed to switch network')
      }
    }
  }

  // Add network
  private async addNetwork(chainId: number): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    const networkConfig = this.getNetworkConfig(chainId)

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig],
      })
    } catch (error) {
      throw new Error('Failed to add network')
    }
  }

  // Get network configuration
  private getNetworkConfig(chainId: number) {
    const networks: Record<number, any> = {
      1: {
        chainId: '0x1',
        chainName: 'Ethereum Mainnet',
        rpcUrls: ['https://mainnet.infura.io/v3/YOUR_PROJECT_ID'],
        blockExplorerUrls: ['https://etherscan.io'],
      },
      5: {
        chainId: '0x5',
        chainName: 'Goerli Testnet',
        rpcUrls: ['https://goerli.infura.io/v3/YOUR_PROJECT_ID'],
        blockExplorerUrls: ['https://goerli.etherscan.io'],
      },
      11155111: {
        chainId: '0xAA36A7',
        chainName: 'Sepolia Testnet',
        rpcUrls: ['https://sepolia.infura.io/v3/YOUR_PROJECT_ID'],
        blockExplorerUrls: ['https://sepolia.etherscan.io'],
      },
      31337: {
        chainId: '0x7A69',
        chainName: 'Localhost',
        rpcUrls: ['http://localhost:8545'],
        blockExplorerUrls: [],
      },
    }

    return networks[chainId] || networks[31337]
  }
}

// Create singleton instance
export const web3Service = new Web3Service()

// Extend window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}
