import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { ethers } from 'ethers'
import toast from 'react-hot-toast'

interface Web3State {
  provider: ethers.BrowserProvider | null
  signer: ethers.JsonRpcSigner | null
  account: string | null
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  error: string | null
}

interface Web3ContextType extends Web3State {
  connectWallet: () => Promise<string | null>
  disconnectWallet: () => void
  switchChain: (chainId: number) => Promise<void>
  signMessage: (message: string) => Promise<string>
  sendTransaction: (to: string, value: string, data?: string) => Promise<string>
}

const Web3Context = createContext<Web3ContextType | null>(null)

export function useWeb3() {
  const context = useContext(Web3Context)
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider')
  }
  return context
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Web3State>({
    provider: null,
    signer: null,
    account: null,
    chainId: null,
    isConnected: false,
    isConnecting: false,
    error: null,
  })

  // Initialize provider and check connection
  useEffect(() => {
    const initializeWeb3 = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.listAccounts()
          
          if (accounts.length > 0) {
            const signer = await provider.getSigner()
            const network = await provider.getNetwork()
            
            setState({
              provider,
              signer,
              account: accounts[0].address,
              chainId: Number(network.chainId),
              isConnected: true,
              isConnecting: false,
              error: null,
            })
          } else {
            setState(prev => ({
              ...prev,
              provider,
              isConnecting: false,
            }))
          }
        } catch (error) {
          console.error('Failed to initialize Web3:', error)
          setState(prev => ({
            ...prev,
            isConnecting: false,
            error: 'Failed to initialize Web3 provider',
          }))
        }
      }
    }

    initializeWeb3()

    // Listen for account changes
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          setState(prev => ({
            ...prev,
            signer: null,
            account: null,
            isConnected: false,
          }))
        } else if (accounts[0] !== state.account) {
          // Account changed, reconnect
          connectWallet()
        }
      }

      const handleChainChanged = (chainId: string) => {
        setState(prev => ({
          ...prev,
          chainId: Number(chainId),
        }))
      }

      const handleDisconnect = () => {
        setState(prev => ({
          ...prev,
          signer: null,
          account: null,
          isConnected: false,
        }))
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', handleChainChanged)
      window.ethereum.on('disconnect', handleDisconnect)

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum?.removeListener('chainChanged', handleChainChanged)
        window.ethereum?.removeListener('disconnect', handleDisconnect)
      }
    }
  }, [])

  // Connect wallet
  const connectWallet = useCallback(async (): Promise<string | null> => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed')
      setState(prev => ({
        ...prev,
        error: 'MetaMask is not installed',
      }))
      return null
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }))

    try {
      // Request account access
      await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      const provider = new ethers.BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const account = await signer.getAddress()
      const network = await provider.getNetwork()

      setState({
        provider,
        signer,
        account,
        chainId: Number(network.chainId),
        isConnected: true,
        isConnecting: false,
        error: null,
      })

      toast.success('Wallet connected successfully')
      return account
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to connect wallet'
      toast.error(errorMessage)
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: errorMessage,
      }))
      return null
    }
  }, [])

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setState({
      provider: null,
      signer: null,
      account: null,
      chainId: null,
      isConnected: false,
      isConnecting: false,
      error: null,
    })
    toast.success('Wallet disconnected')
  }, [])

  // Switch blockchain network
  const switchChain = useCallback(async (chainId: number) => {
    if (!window.ethereum) {
      toast.error('MetaMask is not installed')
      return
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
    } catch (error: any) {
      // Chain not found, try to add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${chainId.toString(16)}`,
                chainName: getChainName(chainId),
                rpcUrls: [getChainRpcUrl(chainId)],
                blockExplorerUrls: [getChainExplorerUrl(chainId)],
              },
            ],
          })
        } catch (addError) {
          toast.error('Failed to add network')
        }
      } else {
        toast.error('Failed to switch network')
      }
    }
  }, [])

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!state.signer) {
      throw new Error('Wallet not connected')
    }

    try {
      const signature = await state.signer.signMessage(message)
      return signature
    } catch (error: any) {
      toast.error(error.message || 'Failed to sign message')
      throw error
    }
  }, [state.signer])

  // Send transaction
  const sendTransaction = useCallback(async (
    to: string,
    value: string,
    data?: string
  ): Promise<string> => {
    if (!state.signer) {
      throw new Error('Wallet not connected')
    }

    try {
      const tx = await state.signer.sendTransaction({
        to,
        value: ethers.parseEther(value),
        data: data || '0x',
      })

      toast.success('Transaction sent successfully')
      return tx.hash
    } catch (error: any) {
      toast.error(error.message || 'Failed to send transaction')
      throw error
    }
  }, [state.signer])

  const contextValue: Web3ContextType = {
    ...state,
    connectWallet,
    disconnectWallet,
    switchChain,
    signMessage,
    sendTransaction,
  }

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  )
}

// Helper functions for chain information
function getChainName(chainId: number): string {
  const chains: Record<number, string> = {
    1: 'Ethereum Mainnet',
    3: 'Ropsten',
    4: 'Rinkeby',
    5: 'Goerli',
    11155111: 'Sepolia',
    31337: 'Localhost',
  }
  return chains[chainId] || `Chain ${chainId}`
}

function getChainRpcUrl(chainId: number): string {
  const rpcUrls: Record<number, string> = {
    1: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    3: 'https://ropsten.infura.io/v3/YOUR_PROJECT_ID',
    4: 'https://rinkeby.infura.io/v3/YOUR_PROJECT_ID',
    5: 'https://goerli.infura.io/v3/YOUR_PROJECT_ID',
    11155111: 'https://sepolia.infura.io/v3/YOUR_PROJECT_ID',
    31337: 'http://localhost:8545',
  }
  return rpcUrls[chainId] || ''
}

function getChainExplorerUrl(chainId: number): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    3: 'https://ropsten.etherscan.io',
    4: 'https://rinkeby.etherscan.io',
    5: 'https://goerli.etherscan.io',
    11155111: 'https://sepolia.etherscan.io',
    31337: '',
  }
  return explorers[chainId] || ''
}

// Export web3 service for external use
export const web3Service = {
  connectWallet: async (): Promise<string | null> => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    await window.ethereum.request({
      method: 'eth_requestAccounts',
    })

    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return await signer.getAddress()
  },

  signMessage: async (message: string): Promise<string> => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed')
    }

    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer = await provider.getSigner()
    return await signer.signMessage(message)
  },

  getCurrentAccount: async (): Promise<string | null> => {
    if (!window.ethereum) return null

    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    })
    return accounts[0] || null
  },
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any
  }
}
