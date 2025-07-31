import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { agentService } from '../../services/agentService'
import { Agent, CreateAgentDto, UpdateAgentDto, QueryAgentDto } from '../../types/agent'

interface AgentState {
  agents: Agent[]
  currentAgent: Agent | null
  statistics: {
    total: number
    online: number
    offline: number
    busy: number
    error: number
    byStatus: Record<string, number>
  }
  loading: boolean
  error: string | null
  pagination: {
    current: number
    pageSize: number
    total: number
  }
}

const initialState: AgentState = {
  agents: [],
  currentAgent: null,
  statistics: {
    total: 0,
    online: 0,
    offline: 0,
    busy: 0,
    error: 0,
    byStatus: {},
  },
  loading: false,
  error: null,
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
  },
}

// 异步actions
export const fetchAgents = createAsyncThunk(
  'agent/fetchAgents',
  async (params: QueryAgentDto, { rejectWithValue }) => {
    try {
      const response = await agentService.getAgents(params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取Agent列表失败')
    }
  }
)

export const fetchAgentById = createAsyncThunk(
  'agent/fetchAgentById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await agentService.getAgentById(id)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取Agent详情失败')
    }
  }
)

export const createAgent = createAsyncThunk(
  'agent/createAgent',
  async (agentData: CreateAgentDto, { rejectWithValue }) => {
    try {
      const response = await agentService.createAgent(agentData)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '创建Agent失败')
    }
  }
)

export const updateAgent = createAsyncThunk(
  'agent/updateAgent',
  async ({ id, data }: { id: string; data: UpdateAgentDto }, { rejectWithValue }) => {
    try {
      const response = await agentService.updateAgent(id, data)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '更新Agent失败')
    }
  }
)

export const deleteAgent = createAsyncThunk(
  'agent/deleteAgent',
  async (id: string, { rejectWithValue }) => {
    try {
      await agentService.deleteAgent(id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '删除Agent失败')
    }
  }
)

export const enableAgent = createAsyncThunk(
  'agent/enableAgent',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await agentService.enableAgent(id)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '启用Agent失败')
    }
  }
)

export const disableAgent = createAsyncThunk(
  'agent/disableAgent',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await agentService.disableAgent(id)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '禁用Agent失败')
    }
  }
)

export const fetchAgentStatistics = createAsyncThunk(
  'agent/fetchAgentStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await agentService.getStatistics()
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取Agent统计失败')
    }
  }
)

const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentAgent: (state) => {
      state.currentAgent = null
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    updateAgentStatus: (state, action: PayloadAction<{ id: string; status: string; lastHeartbeat?: string }>) => {
      const { id, status, lastHeartbeat } = action.payload
      const agent = state.agents.find(a => a.id === id)
      if (agent) {
        agent.status = status
        if (lastHeartbeat) {
          agent.lastHeartbeat = lastHeartbeat
        }
      }
      if (state.currentAgent?.id === id) {
        state.currentAgent.status = status
        if (lastHeartbeat) {
          state.currentAgent.lastHeartbeat = lastHeartbeat
        }
      }
    },
    updateAgentResources: (state, action: PayloadAction<{ id: string; resources: any }>) => {
      const { id, resources } = action.payload
      const agent = state.agents.find(a => a.id === id)
      if (agent) {
        agent.resources = { ...agent.resources, ...resources }
      }
      if (state.currentAgent?.id === id) {
        state.currentAgent.resources = { ...state.currentAgent.resources, ...resources }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取Agent列表
      .addCase(fetchAgents.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAgents.fulfilled, (state, action) => {
        state.loading = false
        state.agents = action.payload.data
        state.pagination.total = action.payload.total
        state.error = null
      })
      .addCase(fetchAgents.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取Agent详情
      .addCase(fetchAgentById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAgentById.fulfilled, (state, action) => {
        state.loading = false
        state.currentAgent = action.payload
        state.error = null
      })
      .addCase(fetchAgentById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 创建Agent
      .addCase(createAgent.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createAgent.fulfilled, (state, action) => {
        state.loading = false
        state.agents.unshift(action.payload)
        state.error = null
      })
      .addCase(createAgent.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 更新Agent
      .addCase(updateAgent.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateAgent.fulfilled, (state, action) => {
        state.loading = false
        const index = state.agents.findIndex(agent => agent.id === action.payload.id)
        if (index !== -1) {
          state.agents[index] = action.payload
        }
        if (state.currentAgent?.id === action.payload.id) {
          state.currentAgent = action.payload
        }
        state.error = null
      })
      .addCase(updateAgent.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 删除Agent
      .addCase(deleteAgent.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteAgent.fulfilled, (state, action) => {
        state.loading = false
        state.agents = state.agents.filter(agent => agent.id !== action.payload)
        if (state.currentAgent?.id === action.payload) {
          state.currentAgent = null
        }
        state.error = null
      })
      .addCase(deleteAgent.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 启用Agent
      .addCase(enableAgent.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(enableAgent.fulfilled, (state, action) => {
        state.loading = false
        const index = state.agents.findIndex(agent => agent.id === action.payload.id)
        if (index !== -1) {
          state.agents[index] = action.payload
        }
        if (state.currentAgent?.id === action.payload.id) {
          state.currentAgent = action.payload
        }
        state.error = null
      })
      .addCase(enableAgent.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 禁用Agent
      .addCase(disableAgent.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(disableAgent.fulfilled, (state, action) => {
        state.loading = false
        const index = state.agents.findIndex(agent => agent.id === action.payload.id)
        if (index !== -1) {
          state.agents[index] = action.payload
        }
        if (state.currentAgent?.id === action.payload.id) {
          state.currentAgent = action.payload
        }
        state.error = null
      })
      .addCase(disableAgent.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取Agent统计
      .addCase(fetchAgentStatistics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAgentStatistics.fulfilled, (state, action) => {
        state.loading = false
        state.statistics = action.payload
        state.error = null
      })
      .addCase(fetchAgentStatistics.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, clearCurrentAgent, setPagination, updateAgentStatus, updateAgentResources } = agentSlice.actions
export default agentSlice.reducer