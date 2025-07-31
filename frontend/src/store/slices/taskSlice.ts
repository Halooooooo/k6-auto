import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { taskService } from '../../services/taskService'
import { Task, CreateTaskDto, UpdateTaskDto, QueryTaskDto, ExecuteTaskDto } from '../../types/task'

interface TaskState {
  tasks: Task[]
  currentTask: Task | null
  statistics: {
    total: number
    running: number
    completed: number
    failed: number
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

const initialState: TaskState = {
  tasks: [],
  currentTask: null,
  statistics: {
    total: 0,
    running: 0,
    completed: 0,
    failed: 0,
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
export const fetchTasks = createAsyncThunk(
  'task/fetchTasks',
  async (params: QueryTaskDto, { rejectWithValue }) => {
    try {
      const response = await taskService.getTasks(params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取任务列表失败')
    }
  }
)

export const fetchTaskById = createAsyncThunk(
  'task/fetchTaskById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await taskService.getTaskById(id)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取任务详情失败')
    }
  }
)

export const createTask = createAsyncThunk(
  'task/createTask',
  async (taskData: CreateTaskDto, { rejectWithValue }) => {
    try {
      const response = await taskService.createTask(taskData)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '创建任务失败')
    }
  }
)

export const updateTask = createAsyncThunk(
  'task/updateTask',
  async ({ id, data }: { id: string; data: UpdateTaskDto }, { rejectWithValue }) => {
    try {
      const response = await taskService.updateTask(id, data)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '更新任务失败')
    }
  }
)

export const deleteTask = createAsyncThunk(
  'task/deleteTask',
  async (id: string, { rejectWithValue }) => {
    try {
      await taskService.deleteTask(id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '删除任务失败')
    }
  }
)

export const executeTask = createAsyncThunk(
  'task/executeTask',
  async ({ id, data }: { id: string; data?: ExecuteTaskDto }, { rejectWithValue }) => {
    try {
      const response = await taskService.executeTask(id, data)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '执行任务失败')
    }
  }
)

export const stopTask = createAsyncThunk(
  'task/stopTask',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await taskService.stopTask(id)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '停止任务失败')
    }
  }
)

export const fetchTaskStatistics = createAsyncThunk(
  'task/fetchTaskStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await taskService.getStatistics()
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取任务统计失败')
    }
  }
)

const taskSlice = createSlice({
  name: 'task',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentTask: (state) => {
      state.currentTask = null
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    updateTaskStatus: (state, action: PayloadAction<{ id: string; status: string; error?: string }>) => {
      const { id, status, error } = action.payload
      const task = state.tasks.find(t => t.id === id)
      if (task) {
        task.status = status
        if (error) {
          task.error = error
        }
        if (status === 'running') {
          task.startTime = new Date().toISOString()
        } else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
          task.endTime = new Date().toISOString()
        }
      }
      if (state.currentTask?.id === id) {
        state.currentTask.status = status
        if (error) {
          state.currentTask.error = error
        }
        if (status === 'running') {
          state.currentTask.startTime = new Date().toISOString()
        } else if (status === 'completed' || status === 'failed' || status === 'cancelled') {
          state.currentTask.endTime = new Date().toISOString()
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取任务列表
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false
        state.tasks = action.payload.data
        state.pagination.total = action.payload.total
        state.error = null
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取任务详情
      .addCase(fetchTaskById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTaskById.fulfilled, (state, action) => {
        state.loading = false
        state.currentTask = action.payload
        state.error = null
      })
      .addCase(fetchTaskById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 创建任务
      .addCase(createTask.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.loading = false
        state.tasks.unshift(action.payload)
        state.error = null
      })
      .addCase(createTask.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 更新任务
      .addCase(updateTask.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.loading = false
        const index = state.tasks.findIndex(task => task.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload
        }
        state.error = null
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 删除任务
      .addCase(deleteTask.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.loading = false
        state.tasks = state.tasks.filter(task => task.id !== action.payload)
        if (state.currentTask?.id === action.payload) {
          state.currentTask = null
        }
        state.error = null
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 执行任务
      .addCase(executeTask.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(executeTask.fulfilled, (state, action) => {
        state.loading = false
        const index = state.tasks.findIndex(task => task.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload
        }
        state.error = null
      })
      .addCase(executeTask.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 停止任务
      .addCase(stopTask.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(stopTask.fulfilled, (state, action) => {
        state.loading = false
        const index = state.tasks.findIndex(task => task.id === action.payload.id)
        if (index !== -1) {
          state.tasks[index] = action.payload
        }
        if (state.currentTask?.id === action.payload.id) {
          state.currentTask = action.payload
        }
        state.error = null
      })
      .addCase(stopTask.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取任务统计
      .addCase(fetchTaskStatistics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTaskStatistics.fulfilled, (state, action) => {
        state.loading = false
        state.statistics = action.payload
        state.error = null
      })
      .addCase(fetchTaskStatistics.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, clearCurrentTask, setPagination, updateTaskStatus } = taskSlice.actions
export default taskSlice.reducer