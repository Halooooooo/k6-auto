import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { chatService } from '../../services/chatService'
import { ChatMessage, SendMessageDto } from '../../types/chat'

interface ChatState {
  messages: ChatMessage[]
  isOpen: boolean
  isConnected: boolean
  isTyping: boolean
  loading: boolean
  error: string | null
  unreadCount: number
}

const initialState: ChatState = {
  messages: [],
  isOpen: false,
  isConnected: false,
  isTyping: false,
  loading: false,
  error: null,
  unreadCount: 0,
}

// 异步actions
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (messageData: SendMessageDto, { rejectWithValue }) => {
    try {
      const response = await chatService.sendMessage(messageData)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '发送消息失败')
    }
  }
)

export const fetchChatHistory = createAsyncThunk(
  'chat/fetchChatHistory',
  async (params?: { limit?: number; offset?: number }, { rejectWithValue }) => {
    try {
      const response = await chatService.getChatHistory(params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取聊天记录失败')
    }
  }
)

export const clearChatHistory = createAsyncThunk(
  'chat/clearChatHistory',
  async (_, { rejectWithValue }) => {
    try {
      await chatService.clearChatHistory()
      return true
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '清除聊天记录失败')
    }
  }
)

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    toggleChat: (state) => {
      state.isOpen = !state.isOpen
      if (state.isOpen) {
        state.unreadCount = 0
      }
    },
    openChat: (state) => {
      state.isOpen = true
      state.unreadCount = 0
    },
    closeChat: (state) => {
      state.isOpen = false
    },
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.isConnected = action.payload
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages.push(action.payload)
      if (!state.isOpen && action.payload.role === 'assistant') {
        state.unreadCount += 1
      }
    },
    updateMessage: (state, action: PayloadAction<{ id: string; content?: string; status?: string }>) => {
      const { id, content, status } = action.payload
      const message = state.messages.find(msg => msg.id === id)
      if (message) {
        if (content !== undefined) {
          message.content = content
        }
        if (status !== undefined) {
          message.status = status
        }
        message.updatedAt = new Date().toISOString()
      }
    },
    removeMessage: (state, action: PayloadAction<string>) => {
      state.messages = state.messages.filter(msg => msg.id !== action.payload)
    },
    clearError: (state) => {
      state.error = null
    },
    resetUnreadCount: (state) => {
      state.unreadCount = 0
    },
  },
  extraReducers: (builder) => {
    builder
      // 发送消息
      .addCase(sendMessage.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.loading = false
        // 消息已经通过WebSocket添加到状态中，这里不需要重复添加
        state.error = null
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取聊天记录
      .addCase(fetchChatHistory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchChatHistory.fulfilled, (state, action) => {
        state.loading = false
        state.messages = action.payload.reverse() // 按时间顺序排列
        state.error = null
      })
      .addCase(fetchChatHistory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 清除聊天记录
      .addCase(clearChatHistory.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(clearChatHistory.fulfilled, (state) => {
        state.loading = false
        state.messages = []
        state.error = null
      })
      .addCase(clearChatHistory.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  toggleChat,
  openChat,
  closeChat,
  setConnected,
  setTyping,
  addMessage,
  updateMessage,
  removeMessage,
  clearError,
  resetUnreadCount,
} = chatSlice.actions

export default chatSlice.reducer