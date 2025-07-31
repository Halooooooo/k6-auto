import { Task, CreateTaskDto, UpdateTaskDto, QueryTaskDto, ExecuteTaskDto, TaskListResponse, TaskStatistics, TaskExecution } from '../types/task'
import { ApiResponse } from '../types'
import { apiClient } from './apiClient'

export const taskService = {
  // 获取任务列表
  async getTasks(params: QueryTaskDto): Promise<TaskListResponse> {
    const response = await apiClient.get<ApiResponse<TaskListResponse>>('/tasks', { params })
    return response.data.data
  },

  // 根据ID获取任务详情
  async getTaskById(id: string): Promise<Task> {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`)
    return response.data.data
  },

  // 创建任务
  async createTask(taskData: CreateTaskDto): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', taskData)
    return response.data.data
  },

  // 更新任务
  async updateTask(id: string, taskData: UpdateTaskDto): Promise<Task> {
    const response = await apiClient.put<ApiResponse<Task>>(`/tasks/${id}`, taskData)
    return response.data.data
  },

  // 删除任务
  async deleteTask(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`)
  },

  // 执行任务
  async executeTask(id: string, executeData?: ExecuteTaskDto): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/execute`, executeData)
    return response.data.data
  },

  // 停止任务
  async stopTask(id: string): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/stop`)
    return response.data.data
  },

  // 暂停任务
  async pauseTask(id: string): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/pause`)
    return response.data.data
  },

  // 恢复任务
  async resumeTask(id: string): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/resume`)
    return response.data.data
  },

  // 重新执行任务
  async retryTask(id: string): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/retry`)
    return response.data.data
  },

  // 获取任务执行历史
  async getTaskExecutions(id: string, params?: { page?: number; limit?: number }): Promise<{ data: TaskExecution[]; total: number }> {
    const response = await apiClient.get<ApiResponse<{ data: TaskExecution[]; total: number }>>(`/tasks/${id}/executions`, { params })
    return response.data.data
  },

  // 获取任务日志
  async getTaskLogs(id: string, params?: { executionId?: string; lines?: number; follow?: boolean }): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<string[]>>(`/tasks/${id}/logs`, { params })
    return response.data.data
  },

  // 获取任务统计信息
  async getStatistics(): Promise<TaskStatistics> {
    const response = await apiClient.get<ApiResponse<TaskStatistics>>('/tasks/statistics')
    return response.data.data
  },

  // 获取任务状态
  async getTaskStatus(id: string): Promise<{ status: string; progress?: number; message?: string }> {
    const response = await apiClient.get<ApiResponse<{ status: string; progress?: number; message?: string }>>(`/tasks/${id}/status`)
    return response.data.data
  },

  // 复制任务
  async copyTask(id: string): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(`/tasks/${id}/copy`)
    return response.data.data
  },

  // 启用/禁用任务
  async toggleTaskStatus(id: string, isEnabled: boolean): Promise<Task> {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/toggle`, { isEnabled })
    return response.data.data
  },

  // 批量操作任务
  async batchExecute(ids: string[], executeData?: ExecuteTaskDto): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post<ApiResponse<{ success: string[]; failed: string[] }>>('/tasks/batch/execute', { ids, ...executeData })
    return response.data.data
  },

  async batchStop(ids: string[]): Promise<{ success: string[]; failed: string[] }> {
    const response = await apiClient.post<ApiResponse<{ success: string[]; failed: string[] }>>('/tasks/batch/stop', { ids })
    return response.data.data
  },

  async batchDelete(ids: string[]): Promise<void> {
    await apiClient.delete('/tasks/batch', { data: { ids } })
  },

  async batchToggleStatus(ids: string[], isEnabled: boolean): Promise<void> {
    await apiClient.patch('/tasks/batch/toggle', { ids, isEnabled })
  },

  // 获取任务调度信息
  async getScheduledTasks(): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]>>('/tasks/scheduled')
    return response.data.data
  },

  // 获取正在运行的任务
  async getRunningTasks(): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]>>('/tasks/running')
    return response.data.data
  },

  // 验证Cron表达式
  async validateCron(expression: string): Promise<{ valid: boolean; nextRuns?: string[]; error?: string }> {
    const response = await apiClient.post<ApiResponse<{ valid: boolean; nextRuns?: string[]; error?: string }>>('/tasks/validate-cron', { expression })
    return response.data.data
  },

  // 获取任务模板
  async getTemplates(): Promise<Array<{ id: string; name: string; description: string; config: any }>> {
    const response = await apiClient.get<ApiResponse<Array<{ id: string; name: string; description: string; config: any }>>>('/tasks/templates')
    return response.data.data
  },

  // 根据模板创建任务
  async createFromTemplate(templateId: string, taskData: Partial<CreateTaskDto>): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(`/tasks/templates/${templateId}/create`, taskData)
    return response.data.data
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
    
    const response = await apiClient.post<ApiResponse<{ success: number; failed: number; errors?: string[] }>>('/tasks/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data.data
  }
}