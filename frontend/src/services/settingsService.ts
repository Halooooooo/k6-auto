import { apiClient } from './apiClient'
import { SystemSettings, NotificationSettings, SecuritySettings, UserSettings } from '../types/settings'

export interface ApiKey {
  id: string
  name: string
  description: string
  permissions: string[]
  createdAt: string
  lastUsedAt?: string
  key?: string
}

export interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user' | 'viewer'
  status: 'active' | 'inactive'
  lastLoginAt?: string
  createdAt: string
}

export interface ShareLink {
  url: string
  expiresAt: string
}

class SettingsService {
  // 系统设置
  async getSystemSettings() {
    return apiClient.get<SystemSettings>('/api/settings/system')
  }

  async updateSystemSettings(settings: SystemSettings) {
    return apiClient.put<SystemSettings>('/api/settings/system', settings)
  }

  // 通知设置
  async getNotificationSettings() {
    return apiClient.get<NotificationSettings>('/api/settings/notification')
  }

  async updateNotificationSettings(settings: NotificationSettings) {
    return apiClient.put<NotificationSettings>('/api/settings/notification', settings)
  }

  // 安全设置
  async getSecuritySettings() {
    return apiClient.get<SecuritySettings>('/api/settings/security')
  }

  async updateSecuritySettings(settings: SecuritySettings) {
    return apiClient.put<SecuritySettings>('/api/settings/security', settings)
  }

  // 用户设置
  async getUserSettings() {
    return apiClient.get<UserSettings>('/api/settings/user')
  }

  async updateUserSettings(settings: UserSettings) {
    return apiClient.put<UserSettings>('/api/settings/user', settings)
  }

  // API密钥管理
  async getApiKeys() {
    return apiClient.get<ApiKey[]>('/api/settings/api-keys')
  }

  async createApiKey(data: { name: string; description: string; permissions: string[] }) {
    return apiClient.post<ApiKey>('/api/settings/api-keys', data)
  }

  async deleteApiKey(id: string) {
    return apiClient.delete(`/api/settings/api-keys/${id}`)
  }

  // 用户管理
  async getUsers() {
    return apiClient.get<User[]>('/api/settings/users')
  }

  async createUser(data: { username: string; email: string; password: string; role: string; status: string }) {
    return apiClient.post<User>('/api/settings/users', data)
  }

  async updateUser(id: string, data: { email: string; role: string; status: string }) {
    return apiClient.put<User>(`/api/settings/users/${id}`, data)
  }

  async deleteUser(id: string) {
    return apiClient.delete(`/api/settings/users/${id}`)
  }

  // 连接测试
  async testConnection(type: 'email' | 'webhook') {
    return apiClient.post(`/api/settings/test-connection`, { type })
  }

  // 分享链接
  async getShareLink(resultId: string) {
    return apiClient.post<ShareLink>(`/api/results/${resultId}/share`)
  }

  // 批量操作
  async batchDelete(ids: string[]) {
    return apiClient.post('/api/results/batch-delete', { ids })
  }

  async batchExport(ids: string[]) {
    const response = await apiClient.post('/api/results/batch-export', { ids }, {
      responseType: 'blob'
    })
    return response.data
  }
}

export const settingsService = new SettingsService()