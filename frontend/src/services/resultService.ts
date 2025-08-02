import { Result, QueryResultDto, ResultListResponse, ResultStatistics, ResultComparison } from '../types/result'
import { ApiResponse } from '../types'
import { apiClient } from './apiClient'

export const resultService = {
  // 获取测试结果列表
  async getResults(params: QueryResultDto): Promise<ResultListResponse> {
    const response = await apiClient.get<ResultListResponse>('/results', { params })
    return response.data
  },

  // 根据ID获取测试结果详情
  async getResultById(id: string): Promise<Result> {
    const response = await apiClient.get<Result>(`/results/${id}`)
    return response.data
  },

  // 删除测试结果
  async deleteResult(id: string): Promise<void> {
    await apiClient.delete(`/results/${id}`)
  },

  // 获取测试结果统计信息
  async getStatistics(params?: {
    scriptId?: string
    taskId?: string
    agentId?: string
    startDate?: string
    endDate?: string
  }): Promise<ResultStatistics> {
    const response = await apiClient.get<ResultStatistics>('/results/statistics', { params })
    return response.data
  },

  // 下载测试报告
  async downloadReport(id: string, format: 'html' | 'json' | 'csv' | 'pdf' = 'html'): Promise<Blob> {
    const response = await apiClient.get(`/results/${id}/report`, {
      params: { format },
      responseType: 'blob'
    })
    return response.data
  },

  // 获取测试结果原始数据
  async getRawData(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/results/${id}/raw`)
    return response.data
  },

  // 获取测试结果指标数据
  async getMetrics(id: string, params?: {
    metrics?: string[]
    groupBy?: string
    interval?: string
  }): Promise<{
    [metricName: string]: Array<{
      timestamp: string
      value: number
      tags?: Record<string, string>
    }>
  }> {
    const response = await apiClient.get<any>(`/results/${id}/metrics`, { params })
    return response.data
  },

  // 获取测试结果日志
  async getLogs(id: string, params?: {
    level?: 'debug' | 'info' | 'warn' | 'error'
    limit?: number
    offset?: number
    search?: string
  }): Promise<{
    logs: Array<{
      timestamp: string
      level: string
      message: string
      source?: string
    }>
    total: number
  }> {
    const response = await apiClient.get<any>(`/results/${id}/logs`, { params })
    return response.data
  },

  // 获取测试结果截图
  async getScreenshots(id: string): Promise<Array<{
    timestamp: string
    url: string
    description?: string
  }>> {
    const response = await apiClient.get<any>(`/results/${id}/screenshots`)
    return response.data
  },

  // 比较测试结果
  async compareResults(baselineId: string, comparisonId: string): Promise<ResultComparison> {
    const response = await apiClient.post<ResultComparison>('/results/compare', {
      baselineId,
      comparisonId
    })
    return response.data
  },

  // 批量比较测试结果
  async batchCompare(baselineId: string, comparisonIds: string[]): Promise<ResultComparison[]> {
    const response = await apiClient.post<ResultComparison[]>('/results/batch-compare', {
      baselineId,
      comparisonIds
    })
    return response.data
  },

  // 获取趋势分析数据
  async getTrendAnalysis(params: {
    scriptId?: string
    taskId?: string
    metric: string
    period: 'hour' | 'day' | 'week' | 'month'
    startDate: string
    endDate: string
  }): Promise<{
    data: Array<{
      timestamp: string
      value: number
      change?: number
      changePercent?: number
    }>
    summary: {
      average: number
      min: number
      max: number
      trend: 'up' | 'down' | 'stable'
      trendPercent: number
    }
  }> {
    const response = await apiClient.get<any>('/results/trend', { params })
    return response.data
  },

  // 获取性能基线
  async getBaseline(scriptId: string): Promise<{
    id: string
    scriptId: string
    metrics: Record<string, number>
    thresholds: Record<string, { min?: number; max?: number; target?: number }>
    createdAt: string
    updatedAt: string
  } | null> {
    const response = await apiClient.get<any>(`/results/baseline/${scriptId}`)
    return response.data
  },

  // 设置性能基线
  async setBaseline(resultId: string): Promise<void> {
    await apiClient.post(`/results/${resultId}/set-baseline`)
  },

  // 获取异常检测结果
  async getAnomalies(params: {
    scriptId?: string
    taskId?: string
    startDate: string
    endDate: string
    sensitivity?: 'low' | 'medium' | 'high'
  }): Promise<Array<{
    resultId: string
    timestamp: string
    metric: string
    value: number
    expectedRange: { min: number; max: number }
    severity: 'low' | 'medium' | 'high'
    description: string
  }>> {
    const response = await apiClient.get<any>('/results/anomalies', { params })
    return response.data
  },

  // 获取测试结果摘要
  async getSummary(id: string): Promise<{
    overview: {
      duration: number
      vus: number
      iterations: number
      requests: number
      dataReceived: number
      dataSent: number
    }
    performance: {
      responseTime: { avg: number; min: number; max: number; p95: number; p99: number }
      throughput: number
      errorRate: number
    }
    thresholds: Array<{
      metric: string
      threshold: string
      passed: boolean
      value: number
    }>
    errors: Array<{
      type: string
      count: number
      percentage: number
      examples: string[]
    }>
  }> {
    const response = await apiClient.get<any>(`/results/${id}/summary`)
    return response.data
  },

  // 批量删除测试结果
  async batchDelete(ids: string[]): Promise<void> {
    await apiClient.delete('/results/batch', { data: { ids } })
  },

  // 批量导出测试结果
  async batchExport(ids: string[], format: 'html' | 'json' | 'csv' | 'pdf' = 'json'): Promise<Blob> {
    const response = await apiClient.post('/results/batch-export', { ids, format }, {
      responseType: 'blob'
    })
    return response.data
  },

  // 获取测试结果标签
  async getTags(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/results/tags')
    return response.data
  },

  // 添加测试结果标签
  async addTags(id: string, tags: string[]): Promise<Result> {
    const response = await apiClient.post<Result>(`/results/${id}/tags`, { tags })
    return response.data
  },

  // 移除测试结果标签
  async removeTags(id: string, tags: string[]): Promise<Result> {
    const response = await apiClient.delete<Result>(`/results/${id}/tags`, { data: { tags } })
    return response.data
  },

  // 获取测试结果评论
  async getComments(id: string): Promise<Array<{
    id: string
    userId: string
    userName: string
    content: string
    createdAt: string
    updatedAt: string
  }>> {
    const response = await apiClient.get<any>(`/results/${id}/comments`)
    return response.data
  },

  // 添加测试结果评论
  async addComment(id: string, content: string): Promise<void> {
    await apiClient.post(`/results/${id}/comments`, { content })
  },

  // 删除测试结果评论
  async deleteComment(resultId: string, commentId: string): Promise<void> {
    await apiClient.delete(`/results/${resultId}/comments/${commentId}`)
  },

  // 获取测试结果分享链接
  async getShareLink(id: string, options?: {
    expiresIn?: number // 过期时间（小时）
    password?: string // 访问密码
    allowDownload?: boolean // 是否允许下载
  }): Promise<{
    shareId: string
    url: string
    expiresAt: string
  }> {
    const response = await apiClient.post<any>(`/results/${id}/share`, options)
    return response.data
  },

  // 通过分享链接访问测试结果
  async getSharedResult(shareId: string, password?: string): Promise<Result> {
    const response = await apiClient.get<Result>(`/shared/results/${shareId}`, {
      params: password ? { password } : {}
    })
    return response.data
  }
}