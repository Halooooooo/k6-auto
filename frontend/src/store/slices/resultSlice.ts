import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { resultService } from '../../services/resultService'
import { Result, QueryResultDto } from '../../types/result'

interface ResultState {
  results: Result[]
  currentResult: Result | null
  statistics: {
    total: number
    successful: number
    failed: number
    avgDuration: number
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

const initialState: ResultState = {
  results: [],
  currentResult: null,
  statistics: {
    total: 0,
    successful: 0,
    failed: 0,
    avgDuration: 0,
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
export const fetchResults = createAsyncThunk(
  'result/fetchResults',
  async (params: QueryResultDto, { rejectWithValue }) => {
    try {
      const response = await resultService.getResults(params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取测试结果列表失败')
    }
  }
)

export const fetchResultById = createAsyncThunk(
  'result/fetchResultById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await resultService.getResultById(id)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取测试结果详情失败')
    }
  }
)

export const fetchResultsByTaskId = createAsyncThunk(
  'result/fetchResultsByTaskId',
  async (taskId: string, { rejectWithValue }) => {
    try {
      const response = await resultService.getResultsByTaskId(taskId)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取任务测试结果失败')
    }
  }
)

export const deleteResult = createAsyncThunk(
  'result/deleteResult',
  async (id: string, { rejectWithValue }) => {
    try {
      await resultService.deleteResult(id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '删除测试结果失败')
    }
  }
)

export const downloadReport = createAsyncThunk(
  'result/downloadReport',
  async ({ id, format }: { id: string; format: 'html' | 'json' }, { rejectWithValue }) => {
    try {
      const response = await resultService.downloadReport(id, format)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '下载报告失败')
    }
  }
)

export const fetchResultStatistics = createAsyncThunk(
  'result/fetchResultStatistics',
  async (params?: { startDate?: string; endDate?: string; taskId?: string }, { rejectWithValue }) => {
    try {
      const response = await resultService.getStatistics(params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取测试结果统计失败')
    }
  }
)

export const compareResults = createAsyncThunk(
  'result/compareResults',
  async (resultIds: string[], { rejectWithValue }) => {
    try {
      const response = await resultService.compareResults(resultIds)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '比较测试结果失败')
    }
  }
)

const resultSlice = createSlice({
  name: 'result',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentResult: (state) => {
      state.currentResult = null
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
    addResult: (state, action: PayloadAction<Result>) => {
      state.results.unshift(action.payload)
    },
    updateResult: (state, action: PayloadAction<Result>) => {
      const index = state.results.findIndex(result => result.id === action.payload.id)
      if (index !== -1) {
        state.results[index] = action.payload
      }
      if (state.currentResult?.id === action.payload.id) {
        state.currentResult = action.payload
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取测试结果列表
      .addCase(fetchResults.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchResults.fulfilled, (state, action) => {
        state.loading = false
        state.results = action.payload.data
        state.pagination.total = action.payload.total
        state.error = null
      })
      .addCase(fetchResults.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取测试结果详情
      .addCase(fetchResultById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchResultById.fulfilled, (state, action) => {
        state.loading = false
        state.currentResult = action.payload
        state.error = null
      })
      .addCase(fetchResultById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 根据任务ID获取测试结果
      .addCase(fetchResultsByTaskId.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchResultsByTaskId.fulfilled, (state, action) => {
        state.loading = false
        state.results = action.payload
        state.error = null
      })
      .addCase(fetchResultsByTaskId.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 删除测试结果
      .addCase(deleteResult.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteResult.fulfilled, (state, action) => {
        state.loading = false
        state.results = state.results.filter(result => result.id !== action.payload)
        if (state.currentResult?.id === action.payload) {
          state.currentResult = null
        }
        state.error = null
      })
      .addCase(deleteResult.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 下载报告
      .addCase(downloadReport.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(downloadReport.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(downloadReport.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取测试结果统计
      .addCase(fetchResultStatistics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchResultStatistics.fulfilled, (state, action) => {
        state.loading = false
        state.statistics = action.payload
        state.error = null
      })
      .addCase(fetchResultStatistics.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 比较测试结果
      .addCase(compareResults.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(compareResults.fulfilled, (state) => {
        state.loading = false
        state.error = null
      })
      .addCase(compareResults.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, clearCurrentResult, setPagination, addResult, updateResult } = resultSlice.actions
export default resultSlice.reducer