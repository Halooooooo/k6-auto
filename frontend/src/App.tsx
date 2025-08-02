import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider, App as AntdApp, theme } from 'antd'
import { Provider } from 'react-redux'
import zhCN from 'antd/locale/zh_CN'
import { store } from './store'
import { useAppSelector, useAppDispatch } from './store/hooks'
import { getCurrentUser, logout } from './store/slices/authSlice'
import { setMessageApi } from './services/apiClient'
import Layout from './components/Layout'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Dashboard from './pages/Dashboard'
import Scripts from './pages/Scripts'
import ScriptDetail from './pages/Scripts/Detail'
import ScriptEditor from './pages/Scripts/Editor'
import Tasks from './pages/Tasks'
import TaskDetail from './pages/Tasks/Detail'
import TaskEditor from './pages/Tasks/Editor'
import Agents from './pages/Agents'
import AgentDetail from './pages/Agents/Detail'
import Results from './pages/Results'
import ResultDetail from './pages/Results/Detail'
import Profile from './pages/Profile'
import Settings from './pages/Settings'
import NotFound from './pages/NotFound'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorBoundary from './components/ErrorBoundary'
import { STORAGE_KEYS } from './constants'
import './App.css'

// 私有路由组件
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAppSelector(state => state.auth)
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// 公共路由组件（已登录用户重定向到仪表板）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAppSelector(state => state.auth)
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />
}

// 应用内容组件
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch()
  const { user, loading } = useAppSelector(state => state.auth)
  const isDarkMode = localStorage.getItem(STORAGE_KEYS.THEME) === 'dark'
  
  useEffect(() => {
    // 检查本地存储中的token，如果存在且Redux中没有用户信息则尝试获取用户信息
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token && !user && !loading) {
      dispatch(getCurrentUser())
    }

    // 监听401错误导致的登出事件
    const handleAuthLogout = () => {
      dispatch(logout())
    }

    window.addEventListener('auth:logout', handleAuthLogout)

    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout)
    }
  }, [dispatch, user])
  
  if (loading) {
    return <LoadingSpinner />
  }
  
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 6,
          wireframe: false
        }
      }}
    >
      <AntdApp>
        <AppWithMessage />
      </AntdApp>
    </ConfigProvider>
  )
}

// 内部组件，用于获取message API
const AppWithMessage: React.FC = () => {
  const { message } = AntdApp.useApp()
  
  useEffect(() => {
    // 设置message API到apiClient
    setMessageApi(message)
  }, [message])
  
  return (
    <ErrorBoundary>
          <Routes>
              {/* 公共路由 */}
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              
              {/* 私有路由 */}
              <Route path="/" element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                
                {/* 脚本管理 */}
                <Route path="scripts" element={<Scripts />} />
                <Route path="scripts/new" element={<ScriptEditor />} />
                <Route path="scripts/create" element={<ScriptEditor />} />
                <Route path="scripts/:id" element={<ScriptDetail />} />
                <Route path="scripts/:id/edit" element={<ScriptEditor />} />
                
                {/* 任务管理 */}
                <Route path="tasks" element={<Tasks />} />
                <Route path="tasks/new" element={<TaskEditor />} />
                <Route path="tasks/:id" element={<TaskDetail />} />
                <Route path="tasks/:id/edit" element={<TaskEditor />} />
                
                {/* Agent管理 */}
                <Route path="agents" element={<Agents />} />
                <Route path="agents/:id" element={<AgentDetail />} />
                
                {/* 测试结果 */}
                <Route path="results" element={<Results />} />
                <Route path="results/:id" element={<ResultDetail />} />
                
                {/* 用户设置 */}
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              
              {/* 404页面 */}
              <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
  )
}

// 主应用组件
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App