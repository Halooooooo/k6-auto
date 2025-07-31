import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { scriptService } from '../../services/scriptService'
import { Script, CreateScriptDto, UpdateScriptDto, QueryScriptDto } from '../../types/script'

interface ScriptState {
  scripts: Script[]
  currentScript: Script | null
  versions: Script[]
  statistics: {
    total: number
    active: number
    byType: Record<string, number>
  }
  loading: boolean
  error: string | null
  pagination: {
    current: number
    pageSize: number
    total: number
  }
}

const initialState: ScriptState = {
  scripts: [],
  currentScript: null,
  versions: [],
  statistics: {
    total: 0,
    active: 0,
    byType: {},
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
export const fetchScripts = createAsyncThunk(
  'script/fetchScripts',
  async (params: QueryScriptDto, { rejectWithValue }) => {
    try {
      const response = await scriptService.getScripts(params)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取脚本列表失败')
    }
  }
)

export const fetchScriptById = createAsyncThunk(
  'script/fetchScriptById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await scriptService.getScriptById(id)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取脚本详情失败')
    }
  }
)

export const createScript = createAsyncThunk(
  'script/createScript',
  async (scriptData: CreateScriptDto, { rejectWithValue }) => {
    try {
      const response = await scriptService.createScript(scriptData)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '创建脚本失败')
    }
  }
)

export const updateScript = createAsyncThunk(
  'script/updateScript',
  async ({ id, data }: { id: string; data: UpdateScriptDto }, { rejectWithValue }) => {
    try {
      const response = await scriptService.updateScript(id, data)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '更新脚本失败')
    }
  }
)

export const deleteScript = createAsyncThunk(
  'script/deleteScript',
  async (id: string, { rejectWithValue }) => {
    try {
      await scriptService.deleteScript(id)
      return id
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '删除脚本失败')
    }
  }
)

export const uploadScript = createAsyncThunk(
  'script/uploadScript',
  async (file: File, { rejectWithValue }) => {
    try {
      const response = await scriptService.uploadScript(file)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '上传脚本失败')
    }
  }
)

export const fetchScriptVersions = createAsyncThunk(
  'script/fetchScriptVersions',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await scriptService.getScriptVersions(id)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取脚本版本失败')
    }
  }
)

export const restoreScriptVersion = createAsyncThunk(
  'script/restoreScriptVersion',
  async ({ id, version }: { id: string; version: number }, { rejectWithValue }) => {
    try {
      const response = await scriptService.restoreVersion(id, version)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '恢复脚本版本失败')
    }
  }
)

export const copyScript = createAsyncThunk(
  'script/copyScript',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await scriptService.copyScript(id)
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '复制脚本失败')
    }
  }
)

export const fetchScriptStatistics = createAsyncThunk(
  'script/fetchScriptStatistics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await scriptService.getStatistics()
      return response
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取脚本统计失败')
    }
  }
)

const scriptSlice = createSlice({
  name: 'script',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentScript: (state) => {
      state.currentScript = null
    },
    setPagination: (state, action: PayloadAction<Partial<typeof initialState.pagination>>) => {
      state.pagination = { ...state.pagination, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取脚本列表
      .addCase(fetchScripts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchScripts.fulfilled, (state, action) => {
        state.loading = false
        state.scripts = action.payload.data
        state.pagination.total = action.payload.total
        state.error = null
      })
      .addCase(fetchScripts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取脚本详情
      .addCase(fetchScriptById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchScriptById.fulfilled, (state, action) => {
        state.loading = false
        state.currentScript = action.payload
        state.error = null
      })
      .addCase(fetchScriptById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 创建脚本
      .addCase(createScript.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createScript.fulfilled, (state, action) => {
        state.loading = false
        state.scripts.unshift(action.payload)
        state.error = null
      })
      .addCase(createScript.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 更新脚本
      .addCase(updateScript.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateScript.fulfilled, (state, action) => {
        state.loading = false
        const index = state.scripts.findIndex(script => script.id === action.payload.id)
        if (index !== -1) {
          state.scripts[index] = action.payload
        }
        if (state.currentScript?.id === action.payload.id) {
          state.currentScript = action.payload
        }
        state.error = null
      })
      .addCase(updateScript.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 删除脚本
      .addCase(deleteScript.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(deleteScript.fulfilled, (state, action) => {
        state.loading = false
        state.scripts = state.scripts.filter(script => script.id !== action.payload)
        if (state.currentScript?.id === action.payload) {
          state.currentScript = null
        }
        state.error = null
      })
      .addCase(deleteScript.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 上传脚本
      .addCase(uploadScript.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(uploadScript.fulfilled, (state, action) => {
        state.loading = false
        state.scripts.unshift(action.payload)
        state.error = null
      })
      .addCase(uploadScript.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取脚本版本
      .addCase(fetchScriptVersions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchScriptVersions.fulfilled, (state, action) => {
        state.loading = false
        state.versions = action.payload
        state.error = null
      })
      .addCase(fetchScriptVersions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 恢复脚本版本
      .addCase(restoreScriptVersion.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(restoreScriptVersion.fulfilled, (state, action) => {
        state.loading = false
        state.currentScript = action.payload
        const index = state.scripts.findIndex(script => script.id === action.payload.id)
        if (index !== -1) {
          state.scripts[index] = action.payload
        }
        state.error = null
      })
      .addCase(restoreScriptVersion.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 复制脚本
      .addCase(copyScript.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(copyScript.fulfilled, (state, action) => {
        state.loading = false
        state.scripts.unshift(action.payload)
        state.error = null
      })
      .addCase(copyScript.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // 获取脚本统计
      .addCase(fetchScriptStatistics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchScriptStatistics.fulfilled, (state, action) => {
        state.loading = false
        state.statistics = action.payload
        state.error = null
      })
      .addCase(fetchScriptStatistics.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError, clearCurrentScript, setPagination } = scriptSlice.actions
export default scriptSlice.reducer