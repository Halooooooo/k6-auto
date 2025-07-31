export interface Result {
  id: string
  taskId: string
  task?: {
    id: string
    name: string
    scriptId: string
    script?: {
      id: string
      name: string
      type: string
    }
  }
  executionId: string
  startTime: string
  endTime?: string
  duration?: number
  success: boolean
  error?: string
  summary: ResultSummary
  metrics: ResultMetrics
  thresholds: Record<string, ThresholdResult>
  htmlReportPath?: string
  jsonReportPath?: string
  logs: string[]
  environment: ResultEnvironment
  createdAt: string
  updatedAt: string
}

export interface ResultSummary {
  vus: number
  vusMax: number
  iterations: number
  iterationDuration: {
    avg: number
    min: number
    max: number
    p90: number
    p95: number
  }
  dataReceived: number
  dataSent: number
  checks: {
    passes: number
    fails: number
    rate: number
  }
  httpReqs: {
    total: number
    rate: number
  }
  httpReqDuration: {
    avg: number
    min: number
    max: number
    p90: number
    p95: number
    p99: number
  }
  httpReqFailed: {
    rate: number
    count: number
  }
}

export interface ResultMetrics {
  [key: string]: {
    type: 'counter' | 'gauge' | 'rate' | 'trend'
    contains: 'default' | 'time' | 'data'
    values: {
      count?: number
      rate?: number
      avg?: number
      min?: number
      max?: number
      med?: number
      p90?: number
      p95?: number
      p99?: number
    }
  }
}

export interface ThresholdResult {
  metric: string
  threshold: string
  specified: boolean
  passed: boolean
  value: number
}

export interface ResultEnvironment {
  agentId?: string
  agentName?: string
  k6Version: string
  os: string
  arch: string
  hostname?: string
  timestamp: string
}

export interface QueryResultDto {
  page?: number
  limit?: number
  search?: string
  taskId?: string
  success?: boolean
  startDate?: string
  endDate?: string
  agentId?: string
  sortBy?: 'startTime' | 'endTime' | 'duration' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ResultStatistics {
  total: number
  successful: number
  failed: number
  avgDuration: number
  avgIterations: number
  avgHttpReqs: number
  avgDataReceived: number
  avgDataSent: number
  successRate: number
  byStatus: Record<string, number>
  byAgent: Record<string, number>
  byTask: Record<string, number>
  trends: {
    daily: Array<{
      date: string
      total: number
      successful: number
      failed: number
    }>
    weekly: Array<{
      week: string
      total: number
      successful: number
      failed: number
    }>
    monthly: Array<{
      month: string
      total: number
      successful: number
      failed: number
    }>
  }
}

export interface ResultComparison {
  results: Result[]
  comparison: {
    metrics: {
      [metric: string]: {
        values: number[]
        trend: 'up' | 'down' | 'stable'
        change: number
        changePercent: number
      }
    }
    summary: {
      bestResult: string
      worstResult: string
      avgImprovement: number
      significantChanges: Array<{
        metric: string
        change: number
        changePercent: number
      }>
    }
  }
}

export type ResultListResponse = PaginatedResponse<Result>

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}