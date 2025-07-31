import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Descriptions,
  Tag,
  Space,
  Typography,
  Tabs,
  Table,
  message,
  Modal,
  Progress,
  Spin
} from 'antd'
import {
  EditOutlined,
  PlayCircleOutlined,
  StopOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  HistoryOutlined,
  FileTextOutlined,
  BarChartOutlined
} from '@ant-design/icons'
import { taskService } from '../../../services'
import './index.css'

const { Title, Text } = Typography
const { TabPane } = Tabs

interface Task {
  id: string
  name: string
  description: string
  scriptId: string
  scriptName: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  progress: number
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
  config: any
  result?: any
}

interface ExecutionLog {
  id: string
  timestamp: string
  level: 'info' | 'warn' | 'error'
  message: string
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [task, setTask] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<ExecutionLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  useEffect(() => {
    if (id) {
      fetchTaskDetail()
      fetchExecutionLogs()
    }
  }, [id])

  const fetchTaskDetail = async () => {
    try {
      setLoading(true)
      const response = await taskService.getTask(id!)
      setTask(response.data)
    } catch (error) {
      message.error('获取任务详情失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchExecutionLogs = async () => {
    try {
      setLogsLoading(true)
      const response = await taskService.getTaskLogs(id!)
      setLogs(response.data)
    } catch (error) {
      console.error('获取执行日志失败:', error)
    } finally {
      setLogsLoading(false)
    }
  }

  const handleStart = async () => {
    try {
      await taskService.startTask(id!)
      message.success('任务启动成功')
      fetchTaskDetail()
    } catch (error) {
      message.error('任务启动失败')
    }
  }

  const handleStop = async () => {
    try {
      await taskService.stopTask(id!)
      message.success('任务停止成功')
      fetchTaskDetail()
    } catch (error) {
      message.error('任务停止失败')
    }
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个任务吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await taskService.deleteTask(id!)
          message.success('任务删除成功')
          navigate('/tasks')
        } catch (error) {
          message.error('任务删除失败')
        }
      }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'orange'
      case 'running': return 'blue'
      case 'completed': return 'green'
      case 'failed': return 'red'
      case 'cancelled': return 'gray'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '等待中'
      case 'running': return '运行中'
      case 'completed': return '已完成'
      case 'failed': return '失败'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'info': return 'blue'
      case 'warn': return 'orange'
      case 'error': return 'red'
      default: return 'default'
    }
  }

  const logColumns = [
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '级别',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      render: (level: string) => (
        <Tag color={getLogLevelColor(level)}>
          {level.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '消息',
      dataIndex: 'message',
      key: 'message',
      ellipsis: true
    }
  ]

  if (loading) {
    return (
      <div className="task-detail-loading">
        <Spin size="large" />
      </div>
    )
  }

  if (!task) {
    return (
      <div className="task-detail-error">
        <Title level={3}>任务不存在</Title>
        <Button onClick={() => navigate('/tasks')}>返回任务列表</Button>
      </div>
    )
  }

  return (
    <div className="task-detail">
      <Card className="task-detail-header">
        <div className="header-content">
          <div className="header-left">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/tasks')}
              className="back-button"
            >
              返回
            </Button>
            <div className="task-info">
              <Title level={2} className="task-title">{task.name}</Title>
              <Space>
                <Tag color={getStatusColor(task.status)}>
                  {getStatusText(task.status)}
                </Tag>
                <Text type="secondary">脚本: {task.scriptName}</Text>
              </Space>
              {task.status === 'running' && (
                <div className="progress-container">
                  <Progress percent={task.progress} size="small" />
                </div>
              )}
            </div>
          </div>
          <div className="header-actions">
            <Space>
              {task.status === 'pending' || task.status === 'failed' ? (
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />}
                  onClick={handleStart}
                >
                  启动任务
                </Button>
              ) : task.status === 'running' ? (
                <Button 
                  danger
                  icon={<StopOutlined />}
                  onClick={handleStop}
                >
                  停止任务
                </Button>
              ) : null}
              <Button 
                icon={<EditOutlined />}
                onClick={() => navigate(`/tasks/${id}/edit`)}
              >
                编辑
              </Button>
              <Button 
                danger 
                icon={<DeleteOutlined />}
                onClick={handleDelete}
              >
                删除
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      <div className="task-detail-content">
        <Tabs defaultActiveKey="info">
          <TabPane tab={<span><FileTextOutlined />基本信息</span>} key="info">
            <Card>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="任务名称">{task.name}</Descriptions.Item>
                <Descriptions.Item label="关联脚本">{task.scriptName}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={getStatusColor(task.status)}>
                    {getStatusText(task.status)}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="进度">
                  <Progress percent={task.progress} size="small" />
                </Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {new Date(task.createdAt).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  {new Date(task.updatedAt).toLocaleString()}
                </Descriptions.Item>
                {task.startedAt && (
                  <Descriptions.Item label="开始时间">
                    {new Date(task.startedAt).toLocaleString()}
                  </Descriptions.Item>
                )}
                {task.completedAt && (
                  <Descriptions.Item label="完成时间">
                    {new Date(task.completedAt).toLocaleString()}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="描述" span={2}>
                  {task.description}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </TabPane>
          
          <TabPane tab={<span><BarChartOutlined />执行结果</span>} key="result">
            <Card>
              {task.result ? (
                <pre className="result-content">
                  <code>{JSON.stringify(task.result, null, 2)}</code>
                </pre>
              ) : (
                <div className="no-result">
                  <Text type="secondary">暂无执行结果</Text>
                </div>
              )}
            </Card>
          </TabPane>
          
          <TabPane tab={<span><HistoryOutlined />执行日志</span>} key="logs">
            <Card>
              <Table
                columns={logColumns}
                dataSource={logs}
                rowKey="id"
                loading={logsLoading}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`
                }}
                scroll={{ y: 400 }}
              />
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </div>
  )
}

export default TaskDetail