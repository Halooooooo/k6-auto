import { Task, CreateTaskDto, UpdateTaskDto, QueryTaskDto, ExecuteTaskDto, TaskListResponse, TaskStatistics, TaskExecution } from '../types/task'
import { ApiResponse } from '../types'
import { apiClient } from './apiClient'

export const taskService = {
  // 获取任务列表
  async getTasks(params: QueryTaskDto): Promise<TaskListResponse> {
    const response = await apiClient.get<TaskListResponse>('/tasks', { params })
    return response.data
  },

  // 根据ID获取任务详情
  async getTaskById(id: string): Promise<Task> {
    const response = await apiClient.get<Task>(`/tasks/${id}`)
    return response.data
  },

  // 获取任务详情（别名方法）
  async getTask(id: string): Promise<Task> {
    return this.getTaskById(id)
  },

  // 创建任务
  async createTask(taskData: CreateTaskDto): Promise<Task> {
    const response = await apiClient.post<Task>('/tasks', taskData)
    return response.data
  },

  // 更新任务
  async updateTask(id: string, taskData: UpdateTaskDto): Promise<Task> {
    const response = await apiClient.put<Task>(`/tasks/${id}`, taskData)
    return response.data
  },

  // 删除任务
  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`)
  },

  // 执行任务
  async executeTask(id: string, executeData?: ExecuteTaskDto): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${id}/execute`, executeData)
    return response.data
  },

  // 启动任务（别名方法）
  async startTask(id: string): Promise<Task> {
    return this.executeTask(id)
  },

  // 停止任务
  async stopTask(id: string): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${id}/stop`)
    return response.data
  },

  // 暂停任务
  async pauseTask(id: string): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${id}/pause`)
    return response.data
  },

  // 恢复任务
  async resumeTask(id: string): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${id}/resume`)
    return response.data
  },

  // 重新执行任务
  async retryTask(id: string): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${id}/retry`)
    return response.data
  },

  // 获取任务执行历史
  async getTaskExecutions(id: string, params?: { page?: number; limit?: number }): Promise<TaskExecution[]> {
    const response = await apiClient.get<{ data: TaskExecution[]; total: number }>(`/tasks/${id}/executions`, { params })
    return response.data.data
  },

  // 获取任务日志
  async getTaskLogs(id: string, params?: { executionId?: string; lines?: number; follow?: boolean }): Promise<string[]> {
    const response = await apiClient.get<string[]>(`/tasks/${id}/logs`, { params })
    return response.data
  },

  // 获取实时日志
  async getRealTimeLogs(id: string): Promise<Array<{ timestamp: string; message: string }>> {
    const response = await apiClient.get<Array<{ timestamp: string; message: string }>>(`/tasks/${id}/realtime-logs`)
    return response.data
  },

  // 下载执行报告
  async downloadExecutionReport(executionId: string): Promise<Blob> {
    const response = await apiClient.get(`/tasks/executions/${executionId}/report`, {
      responseType: 'blob'
    })
    return response.data
  },

  // 获取任务统计信息
  async getStatistics(): Promise<TaskStatistics> {
    const response = await apiClient.get<TaskStatistics>('/tasks/statistics')
    return response.data
  },

  // 获取任务状态
  async getTaskStatus(id: string): Promise<{ status: string; progress?: number; message?: string }> {
    const response = await apiClient.get<{ status: string; progress?: number; message?: string }>(`/tasks/${id}/status`)
    return response.data
  },

  // 复制任务
  async copyTask(id: string): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/${id}/copy`)
    return response.data
  },

  // 启用/禁用任务
  async toggleTaskStatus(id: string, isEnabled: boolean): Promise<Task> {
    const response = await apiClient.patch<Task>(`/tasks/${id}/toggle`, { isEnabled })
    return response.data
  },

  // 批量操作任务
  async batchExecute(ids: string[], executeData?: ExecuteTaskDto): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post<{ success: string[]; failed: string[] }>('/tasks/batch/execute', { ids, ...executeData })
    return response.data
  },

  async batchStop(ids: string[]): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post<{ success: string[]; failed: string[] }>('/tasks/batch/stop', { ids })
    return response.data
  },

  async batchDelete(ids: string[]): Promise<void> {
    await apiClient.delete('/tasks/batch', { data: { ids } })
  },

  async batchToggleStatus(ids: string[], isEnabled: boolean): Promise<void> {
    await apiClient.patch('/tasks/batch/toggle', { ids, isEnabled })
  },

  // 获取任务调度信息
  async getScheduledTasks(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>('/tasks/scheduled')
    return response.data
  },

  // 获取正在运行的任务
  async getRunningTasks(): Promise<Task[]> {
    const response = await apiClient.get<Task[]>('/tasks/running')
    return response.data
  },

  // 验证Cron表达式
  async validateCron(expression: string): Promise<{ valid: boolean; nextRuns?: string[]; error?: string }> {
    const response = await apiClient.post<{ valid: boolean; nextRuns?: string[]; error?: string }>('/tasks/validate-cron', { expression })
    return response.data
  },

  // 获取任务模板
  async getTemplates(): Promise<Array<{ id: string; name: string; description: string; config: any }>> {
    const response = await apiClient.get<Array<{ id: string; name: string; description: string; config: any }>>('/tasks/templates')
    return response.data
  },

  // 根据模板创建任务
  async createFromTemplate(templateId: string, taskData: Partial<CreateTaskDto>): Promise<Task> {
    const response = await apiClient.post<Task>(`/tasks/templates/${templateId}/create`, taskData)
    return response.data
  },

  // 导出任务配置
  async exportTasks(ids?: string[]): Promise<Blob> {
    const params = ids ? { ids: ids.join(',') } : {}
    const response = await apiClient.get('/tasks/export', {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  // 导入任务配置
  async importTasks(file: File): Promise<{ success: number; failed: number; errors?: string[] }> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post<{ success: number; failed: number; errors?: string[] }>('/tasks/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
}