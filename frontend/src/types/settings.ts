export interface SystemSettings {
  systemName: string
  systemDescription: string
  defaultLanguage: string
  timezone: string
  maxConcurrentTasks: number
  taskTimeout: number
  resultRetentionDays: number
  enableCache: boolean
}

export interface NotificationSettings {
  emailEnabled: boolean
  smtpHost: string
  smtpPort: number
  senderEmail: string
  webhookEnabled: boolean
  webhookUrl: string
  webhookSecret: string
}

export interface SecuritySettings {
  enableTwoFactor: boolean
  sessionTimeout: number
  minPasswordLength: number
  passwordComplexity: boolean
  enableIpWhitelist: boolean
  ipWhitelist: string
  maxLoginAttempts: number
  lockoutDuration: number
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  emailNotifications: boolean
  desktopNotifications: boolean
  autoRefresh: boolean
  refreshInterval: number
}