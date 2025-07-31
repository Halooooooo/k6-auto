import React, { useEffect, useState } from 'react'
import { Row, Col, Card, Statistic, Typography, Space, Button, Table, Tag, Progress, List, Avatar } from 'antd'
import {
  PlayCircleOutlined,
  FileTextOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  SyncOutlined
} from '@ant-design/icons'
import { useAppSelector, useAppDispatch } from '../../store/hooks'
import { taskService, agentService, resultService } from '../../services'
import { formatDuration, formatFileSize, formatNumber } from '../../utils'
import { STORAGE_KEYS } from '../../constants'
import './index.css'

const { Title, Text } = Typography

interface DashboardStats {
  totalTasks: number
  runningTasks: number
  completedTasks: number
  failedTasks: number
  totalAgents: number
  onlineAgents: number
  totalScripts: number
  totalResults: number
}

interface RecentTask {
  id: string
  name: string
  status: string
  startTime: string
  duration?: number
  agent?: string
}

interface RecentResult {
  id: string
  taskName: string
  status: string
  completedAt: string
  successRate: number
  avgResponseTime: number
}

const Dashboard: React.FC = () => {
  const dispatch = useAppDispatch()
  const { user } = useAppSelector(state => state.auth)
  const [stats, setStats] = useState<DashboardStats>({
    totalTasks: 0,
    runningTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    totalAgents: 0,
    onlineAgents: 0,
    totalScripts: 0,
    totalResults: 0
  })
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([])
  const [recentResults, setRecentResults] = useState<RecentResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // 加载统计数据
      const [tasksResponse, agentsResponse, resultsResponse] = await Promise.all([
        taskService.getTasks({ page: 1, limit: 1 }),
        agentService.getAgents({ page: 1, limit: 1 }),
        resultService.getResults({ page: 1, limit: 1 })
      ])

      // 加载最近任务
      const recentTasksResponse = await taskService.getTasks({ 
        page: 1, 
        limit: 5,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      // 加载最近结果
      const recentResultsResponse = await resultService.getResults({
        page: 1,
        limit: 5,
        sortBy: 'completedAt',
        sortOrder: 'desc'
      })

      setStats({
        totalTasks: tasksResponse.total,
        runningTasks: tasksResponse.data.filter(t => t.status === 'running').length,
        completedTasks: tasksResponse.data.filter(t => t.status === 'completed').length,
        failedTasks: tasksResponse.data.filter(t => t.status === 'failed').length,
        totalAgents: agentsResponse.total,
        onlineAgents: agentsResponse.data.filter(a => a.status === 'online').length,
        totalScripts: 0, // 需要从脚本服务获取
        totalResults: resultsResponse.total
      })

      setRecentTasks(recentTasksResponse.data)
      setRecentResults(recentResultsResponse.data)
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error)
      
      // 如果是401错误，说明用户未登录或token过期
       if (error.message && error.message.includes('Unauthorized')) {
         // 清除本地存储的token
         localStorage.removeItem(STORAGE_KEYS.TOKEN)
         localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN)
         localStorage.removeItem(STORAGE_KEYS.USER)
         // 重新加载页面，让路由重定向到登录页
         window.location.reload()
       }
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'processing'
      case 'completed': return 'success'
      case 'failed': return 'error'
      case 'pending': return 'default'
      default: return 'default'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <SyncOutlined spin />
      case 'completed': return <CheckCircleOutlined />
      case 'failed': return <ExclamationCircleOutlined />
      case 'pending': return <ClockCircleOutlined />
      default: return <ClockCircleOutlined />
    }
  }

  const taskColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status === 'running' ? '运行中' : 
           status === 'completed' ? '已完成' :
           status === 'failed' ? '失败' : '等待中'}
        </Tag>
      )
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (time: string) => new Date(time).toLocaleString()
    },
    {
      title: '持续时间',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => duration ? formatDuration(duration) : '-'
    }
  ]

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <Title level={2}>仪表板</Title>
        <Text type="secondary">欢迎回来，{user?.username}！</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="总任务数"
              value={stats.totalTasks}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="运行中任务"
              value={stats.runningTasks}
              prefix={<SyncOutlined spin />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="在线Agent"
              value={stats.onlineAgents}
              suffix={`/ ${stats.totalAgents}`}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="stat-card">
            <Statistic
              title="测试结果"
              value={stats.totalResults}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 任务成功率 */}
      <Row gutter={[16, 16]} className="progress-row">
        <Col xs={24} lg={12}>
          <Card title="任务执行情况" className="progress-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>成功率</Text>
                <Progress 
                  percent={stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}
                  status="active"
                  strokeColor="#52c41a"
                />
              </div>
              <div>
                <Text>失败率</Text>
                <Progress 
                  percent={stats.totalTasks > 0 ? Math.round((stats.failedTasks / stats.totalTasks) * 100) : 0}
                  status="exception"
                  strokeColor="#ff4d4f"
                />
              </div>
            </Space>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Agent状态" className="progress-card">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>在线率</Text>
                <Progress 
                  percent={stats.totalAgents > 0 ? Math.round((stats.onlineAgents / stats.totalAgents) * 100) : 0}
                  status="active"
                  strokeColor="#1890ff"
                />
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="在线"
                    value={stats.onlineAgents}
                    valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="离线"
                    value={stats.totalAgents - stats.onlineAgents}
                    valueStyle={{ color: '#ff4d4f', fontSize: '18px' }}
                  />
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 最近活动 */}
      <Row gutter={[16, 16]} className="recent-row">
        <Col xs={24} lg={12}>
          <Card 
            title="最近任务" 
            className="recent-card"
            extra={<Button type="link" href="/tasks">查看全部</Button>}
          >
            <Table
              dataSource={recentTasks}
              columns={taskColumns}
              pagination={false}
              size="small"
              loading={loading}
              rowKey="id"
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card 
            title="最近结果" 
            className="recent-card"
            extra={<Button type="link" href="/results">查看全部</Button>}
          >
            <List
              dataSource={recentResults}
              loading={loading}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<TrophyOutlined />} />}
                    title={item.taskName}
                    description={
                      <Space>
                        <Tag color={getStatusColor(item.status)}>
                          {item.status === 'success' ? '成功' : '失败'}
                        </Tag>
                        <Text type="secondary">
                          {new Date(item.completedAt).toLocaleString()}
                        </Text>
                      </Space>
                    }
                  />
                  <div>
                    <Text strong>{item.successRate}%</Text>
                    <br />
                    <Text type="secondary">{item.avgResponseTime}ms</Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Dashboard