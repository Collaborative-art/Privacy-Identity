import axios from 'axios'
import { User, LoginRequest, AuthResponse, ApiResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('xray_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('xray_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  // Get nonce for wallet signature
  async getNonce(walletAddress: string) {
    const response = await api.get<ApiResponse<{ nonce: string; message: string }>>(
      '/auth/nonce',
      { params: { walletAddress } }
    )
    return response.data
  },

  // Authenticate with signature
  async authenticate(credentials: LoginRequest) {
    const response = await api.post<AuthResponse>('/auth/authenticate', credentials)
    return response.data
  },

  // Refresh token
  async refreshToken(token: string) {
    const response = await api.post<AuthResponse>('/auth/refresh', { token })
    return response.data
  },

  // Logout
  async logout() {
    const response = await api.post<ApiResponse>('/auth/logout')
    return response.data
  },

  // Get current user profile
  async getProfile() {
    const response = await api.get<ApiResponse<User>>('/auth/profile')
    return response.data
  },

  // Update user profile
  async updateProfile(updates: Partial<User>) {
    const response = await api.put<ApiResponse<User>>('/auth/profile', updates)
    return response.data
  },
}
