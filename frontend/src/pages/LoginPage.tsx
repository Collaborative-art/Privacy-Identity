import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Wallet, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export function LoginPage() {
  const navigate = useNavigate()
  const { connectWallet, login, loginMutation } = useAuth()
  const [walletAddress, setWalletAddress] = useState('')
  const [signature, setSignature] = useState('')
  const [email, setEmail] = useState('')
  const [showNonce, setShowNonce] = useState(false)
  const [nonce, setNonce] = useState('')
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectWallet = async () => {
    setIsConnecting(true)
    try {
      const address = await connectWallet()
      if (address) {
        setWalletAddress(address)
        // In a real implementation, you would fetch the nonce from the backend
        setNonce('123456') // Mock nonce
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSignMessage = async () => {
    if (!walletAddress || !nonce) return

    try {
      const message = `Sign this message to authenticate: ${nonce}`
      // In a real implementation, you would use the wallet to sign
      setSignature('0x1234567890abcdef') // Mock signature
    } catch (error) {
      console.error('Failed to sign message:', error)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!walletAddress || !signature) {
      return
    }

    try {
      await login({
        walletAddress,
        signature,
        email: email || undefined,
      })
      navigate('/dashboard')
    } catch (error) {
      console.error('Login failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-2">Welcome Back</h1>
          <p className="text-gray-300">Connect your wallet to access X-Ray Protocol</p>
        </div>

        <Card className="glass-dark border-gray-800">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Wallet Connection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Wallet Connection
              </label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Connect your wallet"
                    value={walletAddress || 'Not connected'}
                    readOnly
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleConnectWallet}
                    disabled={isConnecting}
                    variant="secondary"
                  >
                    {isConnecting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Connect'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Nonce Display */}
            {nonce && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Authentication Message
                </label>
                <div className="relative">
                  <Input
                    type={showNonce ? 'text' : 'password'}
                    value={`Sign this message to authenticate: ${nonce}`}
                    readOnly
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNonce(!showNonce)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNonce ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Signature */}
            {walletAddress && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Signature
                </label>
                <div className="space-y-2">
                  <Input
                    type="text"
                    placeholder="Click to sign message"
                    value={signature || ''}
                    readOnly
                  />
                  {!signature && (
                    <Button
                      type="button"
                      onClick={handleSignMessage}
                      disabled={!nonce}
                      variant="secondary"
                      className="w-full"
                    >
                      Sign Message
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Email (Optional) */}
            {signature && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email (Optional)
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-1">
                  Provide an email for account recovery and notifications
                </p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={!walletAddress || !signature || loginMutation.isPending}
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Help Section */}
          <div className="mt-6 pt-6 border-t border-gray-800">
            <div className="text-center">
              <p className="text-sm text-gray-400 mb-2">
                New to X-Ray Protocol?
              </p>
              <Button variant="ghost" size="sm">
                Learn How It Works
              </Button>
            </div>
          </div>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="glass-dark rounded-lg p-4 border border-gray-800">
            <div className="flex items-center justify-center mb-2">
              <Shield className="w-5 h-5 text-green-400 mr-2" />
              <span className="text-sm font-medium text-green-400">Secure Connection</span>
            </div>
            <p className="text-xs text-gray-400">
              Your wallet connection is encrypted and secure. We never store your private keys.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
