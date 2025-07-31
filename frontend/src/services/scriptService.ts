import { Script, CreateScriptDto, UpdateScriptDto, QueryScriptDto, ScriptListResponse, ScriptStatistics } from '../types/script'
import { ApiResponse } from '../types'
import { apiClient, uploadClient } from './apiClient'

export const scriptService = {
  // 获取脚本列表
  async getScripts(params: QueryScriptDto): Promise<ScriptListResponse> {
    const response = await apiClient.get<ApiResponse<ScriptListResponse>>('/scripts', { params })
    return response.data.data
  },

  // 根据ID获取脚本详情
  async getScript(id: string): Promise<{ data: Script }> {
    const response = await apiClient.get<ApiResponse<Script>>(`/scripts/${id}`)
    return { data: response.data.data }
  },

  // 根据ID获取脚本详情（兼容旧方法）
  async getScriptById(id: string): Promise<Script> {
    const response = await apiClient.get<ApiResponse<Script>>(`/scripts/${id}`)
    return response.data.data
  },

  // 创建脚本
  async createScript(scriptData: CreateScriptDto): Promise<Script> {
    const response = await apiClient.post<ApiResponse<Script>>('/scripts', scriptData)
    return response.data.data
  },

  // 更新脚本
  async updateScript(id: string, scriptData: UpdateScriptDto): Promise<Script> {
    const response = await apiClient.put<ApiResponse<Script>>(`/scripts/${id}`, scriptData)
    return response.data.data
  },

  // 删除脚本
  async deleteScript(id: string): Promise<void> {
    await apiClient.delete(`/scripts/${id}`)
  },

  // 上传脚本文件
  async uploadScript(file: File): Promise<Script> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await uploadClient.post<ApiResponse<Script>>('/scripts/upload', formData)
    return response.data.data
  },

  // 下载脚本文件
  async downloadScript(id: string): Promise<Blob> {
    const response = await apiClient.get(`/scripts/${id}/download`, {
      responseType: 'blob'
    })
    return response.data
  },

  // 获取脚本版本历史
  async getVersionHistory(scriptId: string): Promise<{ data: any[] }> {
    const response = await apiClient.get<ApiResponse<any[]>>(`/script-versions/script/${scriptId}/history`)
    return { data: response.data.data }
  },

  // 获取脚本版本历史（兼容旧方法）
  async getScriptVersions(id: string): Promise<Script[]> {
    const response = await apiClient.get<ApiResponse<Script[]>>(`/scripts/${id}/versions`)
    return response.data.data
  },

  // 回滚到指定版本
  async rollbackVersion(scriptId: string, versionId: string): Promise<Script> {
    const response = await apiClient.post<ApiResponse<Script>>(`/script-versions/script/${scriptId}/rollback/${versionId}`)
    return response.data.data
  },

  // 设置活跃版本
  async setActiveVersion(scriptId: string, versionId: string): Promise<void> {
    await apiClient.post(`/script-versions/script/${scriptId}/set-active/${versionId}`)
  },

  // 删除版本
  async deleteVersion(versionId: string): Promise<void> {
    await apiClient.delete(`/script-versions/${versionId}`)
  },

  // 创建新版本
  async createVersion(scriptId: string, versionData: any): Promise<any> {
    const response = await apiClient.post<ApiResponse<any>>('/script-versions', {
      ...versionData,
      scriptId,
    })
    return response.data.data
  },

  // 恢复到指定版本（兼容旧方法）
  async restoreVersion(id: string, version: number): Promise<Script> {
    const response = await apiClient.post<ApiResponse<Script>>(`/scripts/${id}/restore/${version}`)
    return response.data.data
  },

  // 复制脚本
  async copyScript(id: string): Promise<Script> {
    const response = await apiClient.post<ApiResponse<Script>>(`/scripts/${id}/copy`)
    return response.data.data
  },

  // 获取脚本统计信息
  async getStatistics(): Promise<ScriptStatistics> {
    const response = await apiClient.get<ApiResponse<ScriptStatistics>>('/scripts/statistics')
    return response.data.data
  },

  // 验证脚本语法
  async validateScript(content: string): Promise<{ valid: boolean; errors?: string[] }> {
    const response = await apiClient.post<ApiResponse<{ valid: boolean; errors?: string[] }>>('/scripts/validate', { content })
    return response.data.data
  },

  // 格式化脚本代码
  async formatScript(content: string): Promise<string> {
    const response = await apiClient.post<ApiResponse<{ content: string }>>('/scripts/format', { content })
    return response.data.data.content
  },

  // 获取脚本模板
  async getTemplates(): Promise<Array<{ id: string; name: string; description: string; content: string; type: string }>> {
    const response = await apiClient.get<ApiResponse<Array<{ id: string; name: string; description: string; content: string; type: string }>>>('/scripts/templates')
    return response.data.data
  },

  // 根据模板创建脚本
  async createFromTemplate(templateId: string, scriptData: Partial<CreateScriptDto>): Promise<Script> {
    const response = await apiClient.post<ApiResponse<Script>>(`/scripts/templates/${templateId}/create`, scriptData)
    return response.data.data
  },

  // 搜索脚本
  async searchScripts(query: string, filters?: Partial<QueryScriptDto>): Promise<Script[]> {
    const params = { search: query, ...filters }
    const response = await apiClient.get<ApiResponse<Script[]>>('/scripts/search', { params })
    return response.data.data
  },

  // 获取脚本标签
  async getTags(): Promise<string[]> {
    const response = await apiClient.get<ApiResponse<string[]>>('/scripts/tags')
    return response.data.data
  },

  // 批量删除脚本
  async batchDelete(ids: string[]): Promise<void> {
    await apiClient.delete('/scripts/batch', { data: { ids } })
  },

  // 批量更新脚本状态
  async batchUpdateStatus(ids: string[], isActive: boolean): Promise<void> {
    await apiClient.patch('/scripts/batch/status', { ids, isActive })
  },

  // 导出脚本
  async exportScripts(ids?: string[]): Promise<Blob> {
    const params = ids ? { ids: ids.join(',') } : {}
    const response = await apiClient.get('/scripts/export', {
      params,
      responseType: 'blob'
    })
    return response.data
  },

  // 导入脚本
  async importScripts(file: File): Promise<{ success: number; failed: number; errors?: string[] }> {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await uploadClient.post<ApiResponse<{ success: number; failed: number; errors?: string[] }>>('/scripts/import', formData)
    return response.data.data
  }
}