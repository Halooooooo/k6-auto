import { ChatMessage, SendMessageDto, ChatHistory, ChatResponse, ChatSuggestion, WebSocketMessage } from '../types/chat'
import { ApiResponse } from '../types'
import { apiClient } from './apiClient'

class ChatService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageQueue: SendMessageDto[] = []
  private listeners: Map<string, Function[]> = new Map()

  // HTTP API 方法
  async sendMessage(messageData: SendMessageDto): Promise<ChatResponse> {
    const response = await apiClient.post<ApiResponse<ChatResponse>>('/chat/messages', messageData)
    return response.data.data
  }

  async getChatHistory(params?: {
    limit?: number
    offset?: number
    sessionId?: string
    startDate?: string
    endDate?: string
  }): Promise<ChatHistory> {
    const response = await apiClient.get<ApiResponse<ChatHistory>>('/chat/history', { params })
    return response.data.data
  }

  async clearChatHistory(sessionId?: string): Promise<void> {
    await apiClient.delete('/chat/history', { data: { sessionId } })
  }

  async getSuggestions(context?: {
    currentScript?: string
    currentTask?: string
    recentErrors?: string[]
    userIntent?: string
  }): Promise<ChatSuggestion[]> {
    const response = await apiClient.post<ApiResponse<ChatSuggestion[]>>('/chat/suggestions', context)
    return response.data.data
  }

  async getSessionInfo(sessionId: string): Promise<{
    id: string
    userId: string
    createdAt: string
    lastActivity: string
    messageCount: number
    context: Record<string, any>
  }> {
    const response = await apiClient.get<ApiResponse<any>>(`/chat/sessions/${sessionId}`)
    return response.data.data
  }

  async createSession(context?: Record<string, any>): Promise<{
    sessionId: string
    expiresAt: string
  }> {
    const response = await apiClient.post<ApiResponse<any>>('/chat/sessions', { context })
    return response.data.data
  }

  async updateSessionContext(sessionId: string, context: Record<string, any>): Promise<void> {
    await apiClient.put(`/chat/sessions/${sessionId}/context`, { context })
  }

  async exportChatHistory(params?: {
    sessionId?: string
    startDate?: string
    endDate?: string
    format?: 'json' | 'txt' | 'html'
  }): Promise<Blob> {
    const response = await apiClient.get('/chat/export', {
      params,
      responseType: 'blob'
    })
    return response.data
  }

  // WebSocket 连接管理
  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${process.env.REACT_APP_WS_URL || 'ws://localhost:8080'}/ws/chat?token=${token}`
        this.ws = new WebSocket(wsUrl)

        this.ws.onopen = () => {
          console.log('Chat WebSocket connected')
          this.reconnectAttempts = 0
          this.processMessageQueue()
          this.emit('connected')
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data)
            this.handleWebSocketMessage(message)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = (event) => {
          console.log('Chat WebSocket disconnected:', event.code, event.reason)
          this.emit('disconnected', { code: event.code, reason: event.reason })
          
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(token)
          }
        }

        this.ws.onerror = (error) => {
          console.error('Chat WebSocket error:', error)
          this.emit('error', error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected')
      this.ws = null
    }
    this.messageQueue = []
    this.listeners.clear()
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  // 发送WebSocket消息
  sendWebSocketMessage(message: SendMessageDto): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify({
        type: 'message',
        data: message
      }))
    } else {
      // 如果未连接，将消息加入队列
      this.messageQueue.push(message)
    }
  }

  // 发送打字状态
  sendTypingStatus(isTyping: boolean, sessionId?: string): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify({
        type: 'typing',
        data: { isTyping, sessionId }
      }))
    }
  }

  // 发送心跳
  sendHeartbeat(): void {
    if (this.isConnected()) {
      this.ws!.send(JSON.stringify({
        type: 'ping',
        data: { timestamp: Date.now() }
      }))
    }
  }

  // 事件监听器管理
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback?: Function): void {
    if (!this.listeners.has(event)) return
    
    if (callback) {
      const callbacks = this.listeners.get(event)!
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    } else {
      this.listeners.delete(event)
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in ${event} callback:`, error)
        }
      })
    }
  }

  private handleWebSocketMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'message':
        this.emit('message', message.data)
        break
      case 'typing':
        this.emit('typing', message.data)
        break
      case 'error':
        this.emit('error', message.data)
        break
      case 'pong':
        this.emit('pong', message.data)
        break
      case 'notification':
        this.emit('notification', message.data)
        break
      case 'system':
        this.emit('system', message.data)
        break
      default:
        console.warn('Unknown WebSocket message type:', message.type)
    }
  }

  private scheduleReconnect(token: string): void {
    this.reconnectAttempts++
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
    
    setTimeout(() => {
      this.connect(token).catch(error => {
        console.error('Reconnection failed:', error)
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          this.emit('reconnectFailed')
        }
      })
    }, delay)
  }

  private processMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.isConnected()) {
      const message = this.messageQueue.shift()!
      this.sendWebSocketMessage(message)
    }
  }

  // 获取连接状态
  getConnectionStatus(): {
    connected: boolean
    reconnectAttempts: number
    queuedMessages: number
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length
    }
  }

  // 清空消息队列
  clearMessageQueue(): void {
    this.messageQueue = []
  }

  // 获取AI助手状态
  async getAssistantStatus(): Promise<{
    online: boolean
    model: string
    capabilities: string[]
    responseTime: number
    load: number
  }> {
    const response = await apiClient.get<ApiResponse<any>>('/chat/assistant/status')
    return response.data.data
  }

  // 获取聊天统计
  async getChatStatistics(params?: {
    userId?: string
    startDate?: string
    endDate?: string
  }): Promise<{
    totalMessages: number
    totalSessions: number
    averageResponseTime: number
    popularCommands: Array<{ command: string; count: number }>
    userSatisfaction: number
    errorRate: number
  }> {
    const response = await apiClient.get<ApiResponse<any>>('/chat/statistics', { params })
    return response.data.data
  }

  // 反馈消息质量
  async feedbackMessage(messageId: string, feedback: {
    rating: 1 | 2 | 3 | 4 | 5
    comment?: string
    helpful?: boolean
  }): Promise<void> {
    await apiClient.post(`/chat/messages/${messageId}/feedback`, feedback)
  }

  // 举报消息
  async reportMessage(messageId: string, reason: string, description?: string): Promise<void> {
    await apiClient.post(`/chat/messages/${messageId}/report`, { reason, description })
  }
}

// 创建单例实例
export const chatService = new ChatService()