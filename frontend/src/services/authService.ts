import axios from 'axios'
import { User, LoginDto, RegisterDto, UpdateProfileDto, ChangePasswordDto, LoginResponse } from '../types/auth'
import { ApiResponse } from '../types'
import { apiClient } from './apiClient'

export const authService = {
  // 用户登录
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials)
    return response.data.data
  },

  // 用户注册
  async register(userData: RegisterDto): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>('/auth/register', userData)
    return response.data.data
  },

  // 获取用户信息
  async getProfile(): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>('/auth/profile')
    return response.data.data
  },

  // 更新用户信息
  async updateProfile(userData: UpdateProfileDto): Promise<User> {
    const response = await apiClient.put<ApiResponse<User>>('/auth/profile', userData)
    return response.data.data
  },

  // 修改密码
  async changePassword(passwordData: ChangePasswordDto): Promise<void> {
    await apiClient.put('/auth/change-password', passwordData)
  },

  // 刷新Token
  async refreshToken(): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/refresh')
    return response.data.data
  },

  // 登出
  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
  },

  // 验证Token
  async validateToken(): Promise<boolean> {
    try {
      await apiClient.get('/auth/validate')
      return true
    } catch {
      return false
    }
  },

  // 忘记密码
  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgot-password', { email })
  },

  // 重置密码
  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { token, password })
  },

  // 验证邮箱
  async verifyEmail(token: string): Promise<void> {
    await apiClient.post('/auth/verify-email', { token })
  },

  // 重发验证邮件
  async resendVerificationEmail(): Promise<void> {
    await apiClient.post('/auth/resend-verification')
  }
}