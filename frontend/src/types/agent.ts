export interface Agent {
  id: string
  name: string
  hostname: string
  ip: string
  port: number
  status: AgentStatus
  description?: string
  tags: string[]
  capabilities: AgentCapabilities
  resources: AgentResources
  lastHeartbeat?: string
  version: string
  isEnabled: boolean
  currentTasks: number
  totalTasksExecuted: number
  createdAt: string
  updatedAt: string
}

export type AgentStatus = 'online' | 'offline' | 'busy' | 'error'

export interface AgentCapabilities {
  maxConcurrentTasks: number
  supportedScriptTypes: string[]
  k6Version: string
  os: string
  arch: string
}

export interface AgentResources {
  cpuCores: number
  memory: number
  cpuUsage: number
  memoryUsage: number
  diskUsage?: number
  networkSpeed?: number
}

export interface CreateAgentDto {
  name: string
  hostname: string
  ip: string
  port: number
  description?: string
  tags?: string[]
  capabilities: AgentCapabilities
  isEnabled?: boolean
}

export interface UpdateAgentDto {
  name?: string
  hostname?: string
  ip?: string
  port?: number
  description?: string
  tags?: string[]
  capabilities?: Partial<AgentCapabilities>
  isEnabled?: boolean
}

export interface QueryAgentDto {
  page?: number
  limit?: number
  search?: string
  status?: AgentStatus
  tags?: string[]
  isEnabled?: boolean
  os?: string
  arch?: string
  sortBy?: 'name' | 'hostname' | 'status' | 'lastHeartbeat' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface AgentStatistics {
  total: number
  online: number
  offline: number
  busy: number
  error: number
  byStatus: Record<AgentStatus, number>
  byOs: Record<string, number>
  byArch: Record<string, number>
  avgCpuUsage: number
  avgMemoryUsage: number
  totalTasksExecuted: number
}

export interface AgentHeartbeat {
  agentId: string
  status: AgentStatus
  resources: AgentResources
  currentTasks: number
  timestamp: string
}

export interface AgentTask {
  id: string
  taskId: string
  agentId: string
  status: string
  startTime: string
  endTime?: string
  progress?: number
  logs: string[]
}

export type AgentListResponse = PaginatedResponse<Agent>

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}