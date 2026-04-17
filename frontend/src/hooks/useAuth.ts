import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { User, AuthState, LoginRequest, AuthResponse } from '@/types'
import { authApi } from '@/services/authApi'
import { web3Service } from '@/services/web3Service'

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('xray_token'),
  isAuthenticated: false,
  isLoading: true,
}

export function useAuth() {
  const [state, setState] = useState<AuthState>(initialState)
  const queryClient = useQueryClient()

  // Check authentication status on mount
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: authApi.getProfile,
    enabled: !!state.token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Update state when user data changes
  useEffect(() => {
    if (user) {
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        isLoading: false,
      }))
    } else if (error || !state.token) {
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
      }))
      if (state.token) {
        localStorage.removeItem('xray_token')
      }
    } else {
      setState(prev => ({ ...prev, isLoading }))
    }
  }, [user, error, state.token])

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.authenticate,
    onSuccess: (data: AuthResponse) => {
      const { token, user } = data.data
      localStorage.setItem('xray_token', token)
      setState(prev => ({
        ...prev,
        token,
        user,
        isAuthenticated: true,
        isLoading: false,
      }))
      queryClient.setQueryData(['auth', 'profile'], user)
      toast.success('Successfully authenticated!')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Authentication failed')
      setState(prev => ({ ...prev, isLoading: false }))
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      localStorage.removeItem('xray_token')
      setState(prev => ({
        ...prev,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }))
      queryClient.clear()
      toast.success('Successfully logged out')
    },
    onError: (error: any) => {
      toast.error(error.message || 'Logout failed')
    },
  })

  // Refresh token mutation
  const refreshTokenMutation = useMutation({
    mutationFn: authApi.refreshToken,
    onSuccess: (data: AuthResponse) => {
      const { token, user } = data.data
      localStorage.setItem('xray_token', token)
      setState(prev => ({
        ...prev,
        token,
        user,
        isAuthenticated: true,
      }))
      queryClient.setQueryData(['auth', 'profile'], user)
    },
    onError: () => {
      // If refresh fails, logout
      logout()
    },
  })

  // Connect wallet and authenticate
  const connectWallet = useCallback(async () => {
    try {
      const account = await web3Service.connectWallet()
      if (!account) {
        throw new Error('Failed to connect wallet')
      }

      // Get nonce
      const nonceResponse = await authApi.getNonce(account)
      const { nonce } = nonceResponse.data

      // Sign message
      const message = `Sign this message to authenticate: ${nonce}`
      const signature = await web3Service.signMessage(message)

      // Authenticate
      await loginMutation.mutateAsync({
        walletAddress: account,
        signature,
      })

      return account
    } catch (error: any) {
      toast.error(error.message || 'Failed to connect wallet')
      throw error
    }
  }, [loginMutation])

  // Login function
  const login = useCallback(async (request: LoginRequest) => {
    setState(prev => ({ ...prev, isLoading: true }))
    await loginMutation.mutateAsync(request)
  }, [loginMutation])

  // Logout function
  const logout = useCallback(() => {
    logoutMutation.mutate()
  }, [logoutMutation])

  // Refresh token function
  const refreshToken = useCallback(() => {
    if (state.token) {
      refreshTokenMutation.mutate()
    }
  }, [state.token, refreshTokenMutation])

  // Update user profile
  const updateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      const updatedUser = await authApi.updateProfile(updates)
      setState(prev => ({
        ...prev,
        user: updatedUser.data,
      }))
      queryClient.setQueryData(['auth', 'profile'], updatedUser.data)
      toast.success('Profile updated successfully')
      return updatedUser.data
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
      throw error
    }
  }, [queryClient])

  // Check if user has specific permission
  const hasPermission = useCallback((permission: string) => {
    if (!state.user) return false
    
    // Example permission logic
    const { verification, reputation } = state.user
    switch (permission) {
      case 'verified':
        return verification.isVerified
      case 'reputable':
        return reputation.score >= 250
      case 'premium':
        return reputation.level === 'Gold' || reputation.level === 'Platinum'
      default:
        return false
    }
  }, [state.user])

  return {
    ...state,
    user: user || state.user,
    isLoading: isLoading || state.isLoading,
    login,
    logout,
    refreshToken,
    connectWallet,
    updateProfile,
    hasPermission,
    loginMutation,
    logoutMutation,
    refreshTokenMutation,
  }
}
