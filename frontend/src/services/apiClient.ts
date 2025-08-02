import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { App } from 'antd'
import { STORAGE_KEYS } from '../constants'

// 消息实例，将在App组件中设置
let messageApi: any = null

export const setMessageApi = (api: any) => {
  messageApi = api
}

// 创建axios实例
export const apiClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // 添加认证token
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // 添加请求时间戳
    if (config.params) {
      config.params._t = Date.now()
    } else {
      config.params = { _t: Date.now() }
    }

    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 检查业务状态码 - 只有当明确返回success: false时才认为是业务错误
    if (response.data && response.data.success === false) {
      const errorMessage = response.data.message || '请求失败'
      if (messageApi) {
        messageApi.error(errorMessage)
      } else {
        console.error(errorMessage)
      }
      return Promise.reject(new Error(errorMessage))
    }
    return response
  },
  (error) => {
    console.error('Response error:', error)
    
    // 处理网络错误
    if (!error.response) {
      message.error('网络连接失败，请检查网络设置')
      return Promise.reject(error)
    }

    const { status, data } = error.response

    switch (status) {
      case 400:
        // 请求参数错误
        const badRequestMessage = data?.message || '请求参数错误'
        return Promise.reject(new Error(badRequestMessage))
      case 401:
        // 未授权，清除token并通过Redux处理登出
        localStorage.removeItem(STORAGE_KEYS.TOKEN)
        // 通过自定义事件通知应用处理登出
        window.dispatchEvent(new CustomEvent('auth:logout'))
        if (messageApi) {
          messageApi.error('登录已过期，请重新登录')
        }
        break
      case 403:
        if (messageApi) {
          messageApi.error('没有权限访问该资源')
        }
        break
      case 404:
        if (messageApi) {
          messageApi.error('请求的资源不存在')
        }
        break
      case 409:
        // 资源冲突，如脚本名称已存在
        const conflictMessage = data?.message || '资源冲突'
        return Promise.reject(new Error(conflictMessage))
      case 422:
        // 表单验证错误
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((err: any) => {
            if (messageApi) {
              messageApi.error(err.message)
            }
          })
        } else {
          if (messageApi) {
            messageApi.error(data.message || '请求参数错误')
          }
        }
        break
      case 429:
        if (messageApi) {
          messageApi.error('请求过于频繁，请稍后再试')
        }
        break
      case 500:
        if (messageApi) {
          messageApi.error('服务器内部错误')
        }
        break
      case 502:
      case 503:
      case 504:
        if (messageApi) {
          messageApi.error('服务暂时不可用，请稍后再试')
        }
        break
      default:
        if (messageApi) {
          messageApi.error(data?.message || `请求失败 (${status})`)
        }
    }

    return Promise.reject(error)
  }
)

// 文件上传专用客户端
export const uploadClient: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5分钟超时
  headers: {
    'Content-Type': 'multipart/form-data',
  },
})

// 为上传客户端添加相同的拦截器
uploadClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

uploadClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      window.dispatchEvent(new CustomEvent('auth:logout'))
    }
    return Promise.reject(error)
  }
)

// 导出便捷方法
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<T>(url, config),
  
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.post<T>(url, data, config),
  
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.put<T>(url, data, config),
  
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.patch<T>(url, data, config),
  
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<T>(url, config),
  
  upload: <T = any>(url: string, data: FormData, config?: AxiosRequestConfig) => 
    uploadClient.post<T>(url, data, config),
}

export default apiClient