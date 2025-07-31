import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import scriptSlice from './slices/scriptSlice'
import taskSlice from './slices/taskSlice'
import agentSlice from './slices/agentSlice'
import resultSlice from './slices/resultSlice'
import chatSlice from './slices/chatSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    script: scriptSlice,
    task: taskSlice,
    agent: agentSlice,
    result: resultSlice,
    chat: chatSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch