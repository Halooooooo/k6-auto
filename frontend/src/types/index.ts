// 导出所有类型定义
export * from './auth'
export * from './script'
export * from './task'
export * from './agent'
export * from './result'
export * from './chat'

// 通用类型定义
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
  timestamp: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface QueryParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  [key: string]: any
}

export interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  children?: SelectOption[]
}

export interface TableColumn {
  key: string
  title: string
  dataIndex?: string
  width?: number
  fixed?: 'left' | 'right'
  sorter?: boolean
  filterable?: boolean
  render?: (value: any, record: any, index: number) => React.ReactNode
}

export interface FormField {
  name: string
  label: string
  type: 'input' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'number' | 'password' | 'email' | 'url'
  required?: boolean
  placeholder?: string
  options?: SelectOption[]
  rules?: any[]
  disabled?: boolean
  hidden?: boolean
  span?: number
  [key: string]: any
}

export interface MenuItem {
  key: string
  label: string
  icon?: React.ReactNode
  path?: string
  children?: MenuItem[]
  disabled?: boolean
  hidden?: boolean
}

export interface BreadcrumbItem {
  title: string
  path?: string
}

export interface NotificationItem {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  duration?: number
  timestamp: string
  read: boolean
  actions?: Array<{
    label: string
    action: () => void
  }>
}

export interface FileUpload {
  file: File
  progress: number
  status: 'uploading' | 'done' | 'error'
  response?: any
  error?: string
}

export interface ChartData {
  name: string
  value: number
  [key: string]: any
}

export interface TimeSeriesData {
  timestamp: string
  value: number
  [key: string]: any
}

export interface DashboardCard {
  id: string
  title: string
  type: 'stat' | 'chart' | 'table' | 'list'
  span: number
  data: any
  config?: any
}

export interface FilterConfig {
  key: string
  label: string
  type: 'input' | 'select' | 'date' | 'dateRange'
  options?: SelectOption[]
  placeholder?: string
  defaultValue?: any
}

export interface ExportConfig {
  format: 'csv' | 'excel' | 'pdf' | 'json'
  filename?: string
  columns?: string[]
  filters?: Record<string, any>
}

export interface WebSocketEvent {
  type: string
  data: any
  timestamp: string
}

export interface SystemInfo {
  version: string
  environment: 'development' | 'staging' | 'production'
  uptime: number
  memory: {
    used: number
    total: number
  }
  cpu: {
    usage: number
    cores: number
  }
  database: {
    status: 'connected' | 'disconnected'
    connections: number
  }
  redis: {
    status: 'connected' | 'disconnected'
    memory: number
  }
}

export interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded'
  checks: Array<{
    name: string
    status: 'pass' | 'fail' | 'warn'
    message?: string
    duration: number
  }>
  timestamp: string
}

// 错误类型
export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// 主题配置
export interface ThemeConfig {
  primaryColor: string
  secondaryColor: string
  backgroundColor: string
  textColor: string
  borderColor: string
  borderRadius: number
  fontSize: {
    small: number
    medium: number
    large: number
  }
  spacing: {
    small: number
    medium: number
    large: number
  }
}

// 用户偏好设置
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: 'zh-CN' | 'en-US'
  timezone: string
  dateFormat: string
  timeFormat: '12h' | '24h'
  pageSize: number
  autoRefresh: boolean
  refreshInterval: number
  notifications: {
    email: boolean
    browser: boolean
    sound: boolean
  }
}