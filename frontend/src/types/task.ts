export interface Task {
  id: string
  name: string
  description?: string
  status: TaskStatus
  triggerType: TriggerType
  config: TaskConfig
  cronExpression?: string
  isEnabled: boolean
  scheduledTime?: string
  startTime?: string
  endTime?: string
  error?: string
  logs?: string[]
  scriptId: string
  script?: {
    id: string
    name: string
    type: string
  }
  userId: string
  user?: {
    id: string
    username: string
  }
  agentId?: string
  agent?: {
    id: string
    name: string
    hostname: string
  }
  createdAt: string
  updatedAt: string
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
export type TriggerType = 'manual' | 'scheduled' | 'api' | 'chat'

export interface TaskConfig {
  vus?: number
  duration?: string
  stages?: Stage[]
  thresholds?: Record<string, string[]>
  env?: Record<string, string>
  options?: Record<string, any>
}

export interface Stage {
  duration: string
  target: number
}

export interface CreateTaskDto {
  name: string
  description?: string
  scriptId: string
  config: TaskConfig
  triggerType?: TriggerType
  cronExpression?: string
  isEnabled?: boolean
  scheduledTime?: string
  agentId?: string
}

export interface UpdateTaskDto {
  name?: string
  description?: string
  config?: TaskConfig
  triggerType?: TriggerType
  cronExpression?: string
  isEnabled?: boolean
  scheduledTime?: string
  agentId?: string
}

export interface QueryTaskDto {
  page?: number
  limit?: number
  search?: string
  status?: TaskStatus
  triggerType?: TriggerType
  scriptId?: string
  userId?: string
  agentId?: string
  isEnabled?: boolean
  startDate?: string
  endDate?: string
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'startTime' | 'endTime'
  sortOrder?: 'asc' | 'desc'
}

export interface ExecuteTaskDto {
  agentId?: string
  config?: Partial<TaskConfig>
  env?: Record<string, string>
}

export interface TaskStatistics {
  total: number
  running: number
  completed: number
  failed: number
  cancelled: number
  byStatus: Record<TaskStatus, number>
  byTriggerType: Record<TriggerType, number>
  avgDuration: number
  successRate: number
  recentExecutions: number
}

export interface TaskExecution {
  id: string
  taskId: string
  status: TaskStatus
  startTime: string
  endTime?: string
  duration?: number
  agentId?: string
  error?: string
  logs: string[]
  createdAt: string
}

export type TaskListResponse = PaginatedResponse<Task>

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}