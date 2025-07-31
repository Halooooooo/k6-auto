import { Agent, CreateAgentDto, UpdateAgentDto, QueryAgentDto, AgentListResponse, AgentStatistics, AgentHeartbeat, AgentTask } from '../types/agent'
import { ApiResponse } from '../types'
import { apiClient } from './apiClient'

export const agentService = {
  // 获取Agent列表
  async getAgents(params: QueryAgentDto): Promise<AgentListResponse> {
    const response = await apiClient.get<ApiResponse<AgentListResponse>>('/agents', { params })
    return response.data.data
  },

  // 根据ID获取Agent详情
  async getAgentById(id: string): Promise<Agent> {
    const response = await apiClient.get<ApiResponse<Agent>>(`/agents/${id}`)
    return response.data.data
  },

  // 创建Agent
  async createAgent(agentData: CreateAgentDto): Promise<Agent> {
    const response = await apiClient.post<ApiResponse<Agent>>('/agents', agentData)
    return response.data.data
  },

  // 更新Agent
  async updateAgent(id: string, agentData: UpdateAgentDto): Promise<Agent> {
    const response = await apiClient.put<ApiResponse<Agent>>(`/agents/${id}`, agentData)
    return response.data.data
  },

  // 删除Agent
  async deleteAgent(id: string): Promise<void> {
    await apiClient.delete(`/agents/${id}`)
  },

  // 启用Agent
  async enableAgent(id: string): Promise<Agent> {
    const response = await apiClient.post<ApiResponse<Agent>>(`/agents/${id}/enable`)
    return response.data.data
  },

  // 禁用Agent
  async disableAgent(id: string): Promise<Agent> {
    const response = await apiClient.post<ApiResponse<Agent>>(`/agents/${id}/disable`)
    return response.data.data
  },

  // 测试Agent连接
  async testConnection(id: string): Promise<{ connected: boolean; latency?: number; error?: string }> {
    const response = await apiClient.post<ApiResponse<{ connected: boolean; latency?: number; error?: string }>>(`/agents/${id}/test`)
    return response.data.data
  },

  // 重启Agent
  async restartAgent(id: string): Promise<Agent> {
    const response = await apiClient.post<ApiResponse<Agent>>(`/agents/${id}/restart`)
    return response.data.data
  },

  // 获取Agent统计信息
  async getStatistics(): Promise<AgentStatistics> {
    const response = await apiClient.get<ApiResponse<AgentStatistics>>('/agents/statistics')
    return response.data.data
  },

  // 获取Agent心跳历史
  async getHeartbeatHistory(id: string, params?: { hours?: number; limit?: number }): Promise<AgentHeartbeat[]> {
    const response = await apiClient.get<ApiResponse<AgentHeartbeat[]>>(`/agents/${id}/heartbeat`, { params })
    return response.data.data
  },

  // 获取Agent当前任务
  async getAgentTasks(id: string): Promise<AgentTask[]> {
    const response = await apiClient.get<ApiResponse<AgentTask[]>>(`/agents/${id}/tasks`)
    return response.data.data
  },

  // 获取Agent日志
  async getAgentLogs(id: string, params?: { lines?: number; level?: string; since?: string }): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<string[]>>(`/agents/${id}/logs`, { params })
    return response.data.data
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
    const response = await apiClient.get<ApiResponse<any>>(`/agents/${id}/system`)
    return response.data.data
  },

  // 获取Agent性能指标
  async getMetrics(id: string, params?: { period?: string; metrics?: string[] }): Promise<{
    cpu: Array<{ timestamp: string; value: number }>
    memory: Array<{ timestamp: string; value: number }>
    disk: Array<{ timestamp: string; value: number }>
    network: Array<{ timestamp: string; rx: number; tx: number }>
  }> {
    const response = await apiClient.get<ApiResponse<any>>(`/agents/${id}/metrics`, { params })
    return response.data.data
  },

  // 更新Agent配置
  async updateConfig(id: string, config: Record<string, any>): Promise<Agent> {
    const response = await apiClient.put<ApiResponse<Agent>>(`/agents/${id}/config`, config)
    return response.data.data
  },

  // 获取Agent配置
  async getConfig(id: string): Promise<Record<string, any>> {
    const response = await apiClient.get<ApiResponse<Record<string, any>>>(`/agents/${id}/config`)
    return response.data.data
  },

  // 批量操作Agent
  async batchEnable(ids: string[]): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post<ApiResponse<{ success: string[]; failed: string[] }>>('/agents/batch/enable', { ids })
    return response.data.data
  },

  async batchDisable(ids: string[]): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post<ApiResponse<{ success: string[]; failed: string[] }>>('/agents/batch/disable', { ids })
    return response.data.data
  },

  async batchDelete(ids: string[]): Promise<void> {
    await apiClient.delete('/agents/batch', { data: { ids } })
  },

  async batchRestart(ids: string[]): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post<ApiResponse<{ success: string[]; failed: string[] }>>('/agents/batch/restart', { ids })
    return response.data.data
  },

  // 获取在线Agent
  async getOnlineAgents(): Promise<Agent[]> {
    const response = await apiClient.get<ApiResponse<Agent[]>>('/agents/online')
    return response.data.data
  },

  // 获取可用Agent（用于任务分配）
  async getAvailableAgents(requirements?: {
    scriptType?: string
    minCpuCores?: number
    minMemory?: number
    tags?: string[]
  }): Promise<Agent[]> {
    const response = await apiClient.get<ApiResponse<Agent[]>>('/agents/available', { params: requirements })
    return response.data.data
  },

  // 分配任务到Agent
  async assignTask(agentId: string, taskId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message?: string }>>(`/agents/${agentId}/assign`, { taskId })
    return response.data.data
  },

  // 从Agent移除任务
  async unassignTask(agentId: string, taskId: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.post<ApiResponse<{ success: boolean; message?: string }>>(`/agents/${agentId}/unassign`, { taskId })
    return response.data.data
  },

  // 获取Agent标签
  async getTags(): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<string[]>>('/agents/tags')
    return response.data.data
  },

  // 导出Agent配置
  async exportAgents(ids?: string[]): Promise<Blob> {
    const params = ids ? { ids: ids.join(',') } : {}
    const response = await apiClient.get('/agents/export', {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  // 导入Agent配置
  async importAgents(file: File): Promise<{ success: number; failed: number; errors?: string[] }> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post<ApiResponse<{ success: number; failed: number; errors?: string[] }>>('/agents/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.data
  }
}