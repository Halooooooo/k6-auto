import { Agent, CreateAgentDto, UpdateAgentDto, QueryAgentDto, AgentListResponse, AgentStatistics, AgentHeartbeat, AgentTask } from '../types/agent'
import { ApiResponse } from '../types'
import { apiClient } from './apiClient'

export const agentService = {
  // 获取Agent列表
  async getAgents(params: QueryAgentDto): Promise<AgentListResponse> {
    const response = await apiClient.get<AgentListResponse>('/v1/agents', { params })
    return response.data
  },

  // 根据ID获取Agent详情
  async getAgentById(id: string): Promise<Agent> {
    const response = await apiClient.get<Agent>(`/v1/agents/${id}`)
    return response.data
  },

  // 创建Agent
  async createAgent(agentData: CreateAgentDto): Promise<Agent> {
    const response = await apiClient.post<Agent>('/v1/agents', agentData)
    return response.data
  },

  // 更新Agent
  async updateAgent(id: string, agentData: UpdateAgentDto): Promise<Agent> {
    const response = await apiClient.put<Agent>(`/v1/agents/${id}`, agentData)
    return response.data
  },

  // 删除Agent
  async deleteAgent(id: string): Promise<void> {
    await apiClient.delete(`/v1/agents/${id}`)
  },

  // 启用Agent
  async enableAgent(id: string): Promise<Agent> {
    const response = await apiClient.post<Agent>(`/v1/agents/${id}/enable`)
    return response.data
  },

  // 禁用Agent
  async disableAgent(id: string): Promise<Agent> {
    const response = await apiClient.post<Agent>(`/v1/agents/${id}/disable`)
    return response.data
  },

  // 测试Agent连接
  async testConnection(id: string): Promise<{ connected: boolean; latency?: number; error?: string }> {
    const response = await apiClient.post<{ connected: boolean; latency?: number; error?: string }>(`/v1/agents/${id}/test`)
    return response.data
  },

  // 重启Agent
  async restartAgent(id: string): Promise<Agent> {
    const response = await apiClient.post<Agent>(`/v1/agents/${id}/restart`)
    return response.data
  },

  // 获取Agent统计信息
  async getStatistics(): Promise<AgentStatistics> {
    const response = await apiClient.get<AgentStatistics>('/v1/agents/statistics')
    return response.data
  },

  // 获取Agent心跳历史
  async getHeartbeatHistory(id: string, params?: { hours?: number; limit?: number }): Promise<AgentHeartbeat[]> {
    const response = await apiClient.get<AgentHeartbeat[]>(`/v1/agents/${id}/heartbeat`, { params })
    return response.data
  },

  // 获取Agent当前任务
  async getAgentTasks(id: string): Promise<AgentTask[]> {
    const response = await apiClient.get<AgentTask[]>(`/v1/agents/${id}/tasks`)
    return response.data
  },

  // 获取Agent日志
  async getAgentLogs(id: string, params?: { lines?: number; level?: string; since?: string }): Promise<string[]> {
    const response = await apiClient.get<string[]>(`/v1/agents/${id}/logs`, { params })
    return response.data
  },

  // 获取Agent系统信息
  async getSystemInfo(id: string): Promise<{
    os: string
    arch: string
    cpuCores: number
    memory: number
    disk: { total: number; used: number; available: number }
    network: { interfaces: Array<{ name: string; ip: string; mac: string }> }
    k6Version: string
    uptime: number
  }> {
    const response = await apiClient.get<any>(`/v1/agents/${id}/system`)
    return response.data
  },

  // 获取Agent性能指标
  async getMetrics(id: string, params?: { period?: string; metrics?: string[] }): Promise<{
    cpu: Array<{ timestamp: string; value: number }>
    memory: Array<{ timestamp: string; value: number }>
    disk: Array<{ timestamp: string; value: number }>
    network: Array<{ timestamp: string; rx: number; tx: number }>
  }> {
    const response = await apiClient.get<any>(`/v1/agents/${id}/metrics`, { params })
    return response.data
  },

  // 更新Agent配置
  async updateConfig(id: string, config: Record<string, any>): Promise<Agent> {
    const response = await apiClient.put<Agent>(`/v1/agents/${id}/config`, config)
    return response.data
  },

  // 获取Agent配置
  async getConfig(id: string): Promise<Record<string, any>> {
    const response = await apiClient.get<Record<string, any>>(`/v1/agents/${id}/config`)
    return response.data
  },

  // 批量操作Agent
  async batchEnable(ids: string[]): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post<{ success: string[]; failed: string[] }>('/v1/agents/batch/enable', { ids })
    return response.data
  },

  async batchDisable(ids: string[]): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post<{ success: string[]; failed: string[] }>('/v1/agents/batch/disable', { ids })
    return response.data
  },

  async batchDelete(ids: string[]): Promise<void> {
    await apiClient.delete('/v1/agents/batch', { data: { ids } })
  },

  async batchRestart(ids: string[]): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post<{ success: string[]; failed: string[] }>('/v1/agents/batch/restart', { ids })
    return response.data
  },

  // 获取在线Agent
  async getOnlineAgents(): Promise<Agent[]> {
    const response = await apiClient.get<Agent[]>('/v1/agents/online')
    return response.data
  },

  // 获取可用Agent（用于任务分配）
  async getAvailableAgents(requirements?: {
    scriptType?: string
    minCpuCores?: number
    minMemory?: number
    tags?: string[]
  }): Promise<Agent[]> {
    const response = await apiClient.get<Agent[]>('/v1/agents/available', { params: requirements })
    return response.data
  },

  // 分配任务到Agent
  async assignTask(agentId: string, taskId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>(`/v1/agents/${agentId}/assign`, { taskId })
    return response.data
  },

  // 从Agent移除任务
  async unassignTask(agentId: string, taskId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<{ success: boolean; message?: string }>(`/v1/agents/${agentId}/unassign`, { taskId })
    return response.data
  },

  // 获取Agent标签
  async getTags(): Promise<string[]> {
    const response = await apiClient.get<string[]>('/v1/agents/tags')
    return response.data
  },

  // 导出Agent配置
  async exportAgents(ids?: string[]): Promise<Blob> {
    const params = ids ? { ids: ids.join(',') } : {}
    const response = await apiClient.get('/v1/agents/export', {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  // 导入Agent配置
  async importAgents(file: File): Promise<{ success: number; failed: number; errors?: string[] }> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post<{ success: number; failed: number; errors?: string[] }>('/v1/agents/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
}