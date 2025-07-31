export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  type: 'text' | 'code' | 'task' | 'script' | 'result'
  metadata?: {
    taskId?: string
    scriptId?: string
    resultId?: string
    language?: string
    fileName?: string
    [key: string]: any
  }
  status?: 'sending' | 'sent' | 'delivered' | 'error'
  error?: string
  createdAt: string
  updatedAt: string
}

export interface SendMessageDto {
  content: string
  type?: 'text' | 'code' | 'task' | 'script'
  metadata?: Record<string, any>
  context?: {
    currentPage?: string
    selectedItems?: string[]
    filters?: Record<string, any>
  }
}

export interface ChatContext {
  currentPage: string
  selectedItems: string[]
  filters: Record<string, any>
  recentActions: Array<{
    action: string
    timestamp: string
    data: any
  }>
}

export interface ChatSuggestion {
  id: string
  text: string
  type: 'quick_reply' | 'action' | 'template'
  action?: {
    type: 'create_script' | 'run_task' | 'view_result' | 'navigate'
    data: Record<string, any>
  }
}

export interface ChatResponse {
  message: ChatMessage
  suggestions?: ChatSuggestion[]
  actions?: Array<{
    type: string
    data: any
  }>
}

export interface ChatHistory {
  messages: ChatMessage[]
  total: number
  hasMore: boolean
}

export interface ChatState {
  messages: ChatMessage[]
  isOpen: boolean
  isConnected: boolean
  isTyping: boolean
  loading: boolean
  error: string | null
  unreadCount: number
  context: ChatContext
  suggestions: ChatSuggestion[]
}

export interface WebSocketMessage {
  type: 'message' | 'typing' | 'error' | 'connected' | 'disconnected'
  data: any
  timestamp: string
}

export interface ChatCommand {
  command: string
  description: string
  usage: string
  examples: string[]
  category: 'script' | 'task' | 'result' | 'agent' | 'general'
}

export const CHAT_COMMANDS: ChatCommand[] = [
  {
    command: '/create-script',
    description: '创建新的测试脚本',
    usage: '/create-script [name] [type]',
    examples: ['/create-script api-test load', '/create-script stress-test stress'],
    category: 'script'
  },
  {
    command: '/run-task',
    description: '执行测试任务',
    usage: '/run-task [task-name]',
    examples: ['/run-task api-load-test', '/run-task stress-test-v2'],
    category: 'task'
  },
  {
    command: '/show-results',
    description: '显示测试结果',
    usage: '/show-results [task-id]',
    examples: ['/show-results latest', '/show-results task-123'],
    category: 'result'
  },
  {
    command: '/list-agents',
    description: '列出所有Agent',
    usage: '/list-agents [status]',
    examples: ['/list-agents', '/list-agents online'],
    category: 'agent'
  },
  {
    command: '/help',
    description: '显示帮助信息',
    usage: '/help [command]',
    examples: ['/help', '/help create-script'],
    category: 'general'
  }
]