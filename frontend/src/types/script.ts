export interface Script {
  id: string
  name: string
  description?: string
  content: string
  type: ScriptType
  tags: string[]
  parameters: Record<string, any>
  currentVersion: string
  language: string
  parentId?: string
  isActive: boolean
  authorId: string
  author?: {
    id: string
    username: string
  }
  userId?: string // 兼容字段
  user?: {
    id: string
    username: string
  }
  versions?: ScriptVersion[]
  createdAt: string
  updatedAt: string
}

export type ScriptType = 'load' | 'stress' | 'spike' | 'volume' | 'endurance' | 'api' | 'browser'

export interface CreateScriptDto {
  name: string
  description?: string
  content: string
  type: ScriptType
  tags?: string[]
  parameters?: Record<string, any>
  language?: string
  currentVersion?: string
}

export interface UpdateScriptDto {
  name?: string
  description?: string
  content?: string
  type?: ScriptType
  tags?: string[]
  parameters?: Record<string, any>
  language?: string
  currentVersion?: string
  changeLog?: string
  isActive?: boolean
}

export interface QueryScriptDto {
  page?: number
  limit?: number
  search?: string
  type?: ScriptType
  tags?: string[]
  userId?: string
  isActive?: boolean
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'version'
  sortOrder?: 'asc' | 'desc'
}

export interface ScriptVersion {
  id: string
  scriptId: string
  version: string
  content: string
  changeLog?: string
  parameters?: Record<string, any>
  tags?: string[]
  isActive: boolean
  createdAt: string
  createdBy: {
    id: string
    username: string
  }
  createdById: string
}

export interface ScriptStatistics {
  total: number
  active: number
  byType: Record<ScriptType, number>
  byUser: Record<string, number>
  recentlyCreated: number
  recentlyUpdated: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export type ScriptListResponse = PaginatedResponse<Script>