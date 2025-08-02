import React, { useState, useEffect } from 'react'
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Table,
  Tabs,
  Descriptions,
  Modal,
  message,
  Empty,
  Spin
} from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  DownloadOutlined,
  EyeOutlined,
  ArrowLeftOutlined,
  DeleteOutlined
} from '@ant-design/icons'
import { useParams, useNavigate } from 'react-router-dom'
import { taskService } from '../../../services'
import { Task, TaskExecution, TaskStatus } from '../../../types/task'
import { ScriptType } from '../../../types/script'
import { formatDate, formatDuration } from '../../../utils'
import './index.css'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

interface TaskDetailState {
  task: Task | null
  executions: TaskExecution[]
  loading: boolean
  executionsLoading: boolean
  realTimeLogs: string[]
  isRealTimeMode: boolean
}

const TaskDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // 脚本类型中文映射
  const getTypeText = (type: ScriptType) => {
    switch (type) {
      case 'load_test': return '负载测试'
      case 'stress_test': return '压力测试'
      case 'spike_test': return '峰值测试'
      case 'volume_test': return '容量测试'
      case 'endurance_test': return '耐久测试'
      default: return type
    }
  }
  const [state, setState] = useState<TaskDetailState>({
    task: null,
    executions: [],
    loading: false,
    executionsLoading: false,
    realTimeLogs: [],
    isRealTimeMode: false
  })
  const [activeTab, setActiveTab] = useState('overview')
  const [logModalVisible, setLogModalVisible] = useState(false)
  const [selectedExecution, setSelectedExecution] = useState<TaskExecution | null>(null)

  useEffect(() => {
    if (id) {
      loadTaskDetail()
      loadExecutionHistory()
    }
  }, [id])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (state.task?.status === 'running' && state.isRealTimeMode) {
      interval = setInterval(() => {
        loadRealTimeLogs()
      }, 2000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [state.task?.status, state.isRealTimeMode])

  const loadTaskDetail = async () => {
    if (!id) return
    setState(prev => ({ ...prev, loading: true }))
    try {
      const task = await taskService.getTask(id)
      setState(prev => ({ ...prev, task }))
    } catch (error: any) {
      message.error('加载任务详情失败：' + error.message)
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const loadExecutionHistory = async () => {
    if (!id) return
    setState(prev => ({ ...prev, executionsLoading: true }))
    try {
      const executions = await taskService.getTaskExecutions(id)
      setState(prev => ({ ...prev, executions }))
    } catch (error: any) {
      message.error('加载执行历史失败：' + error.message)
    } finally {
      setState(prev => ({ ...prev, executionsLoading: false }))
    }
  }

  const loadRealTimeLogs = async () => {
    if (!id || !state.task) return
    try {
      const logs = await taskService.getRealTimeLogs(id)
      setState(prev => ({ ...prev, realTimeLogs: logs }))
    } catch (error: any) {
      console.error('获取实时日志失败：', error.message)
    }
  }

  const handleStartTask = async () => {
    if (!id) return
    try {
      await taskService.startTask(id)
      message.success('任务启动成功')
      loadTaskDetail()
      loadExecutionHistory()
    } catch (error: any) {
      message.error('启动失败：' + error.message)
    }
  }

  const handleStopTask = async () => {
    if (!id) return
    try {
      await taskService.stopTask(id)
      message.success('任务停止成功')
      loadTaskDetail()
      setState(prev => ({ ...prev, isRealTimeMode: false }))
    } catch (error: any) {
      message.error('停止失败：' + error.message)
    }
  }

  const handleDownloadReport = async (executionId: string, taskName: string) => {
    try {
      const blob = await taskService.downloadExecutionReport(executionId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${taskName}-${executionId}-report.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      message.success('报告下载成功')
    } catch (error: any) {
      message.error('下载失败：' + error.message)
    }
  }

  const toggleRealTimeMode = () => {
    setState(prev => ({ ...prev, isRealTimeMode: !prev.isRealTimeMode }))
  }

  const handleDeleteTask = async () => {
    if (!id) return
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个任务吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await taskService.deleteTask(id)
          message.success('任务删除成功')
          navigate('/tasks')
        } catch (error: any) {
          message.error('删除失败：' + error.message)
        }
      }
    })
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      running: 'blue',
      success: 'green',
      failed: 'red',
      cancelled: 'gray'
    }
    return colors[status] || 'default'
  }

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      pending: '待执行',
      running: '运行中',
      success: '成功',
      failed: '失败',
      cancelled: '已取消'
    }
    return texts[status] || status
  }

  const getTriggerTypeText = (type: string) => {
    const texts: Record<string, string> = {
      manual: '手动触发',
      scheduled: '定时触发'
    }
    return texts[type] || type
  }

  const formatDuration = (start?: string, end?: string) => {
    if (!start) return '-'
    if (!end) return '进行中'
    const duration = new Date(end).getTime() - new Date(start).getTime()
    const seconds = Math.floor(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`
    return `${seconds}s`
  }



  if (state.loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!state.task) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Empty description="任务不存在" />
        <Button onClick={() => navigate('/tasks')} style={{ marginTop: 16 }}>
          返回任务列表
        </Button>
      </div>
    )
  }

  const { task, executions, executionsLoading, realTimeLogs, isRealTimeMode } = state

  return (
    <div className="task-detail" style={{ padding: '24px' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/tasks')}
            style={{ marginRight: '16px' }}
          >
            返回
          </Button>
          <Title level={3} style={{ margin: 0, display: 'inline' }}>
            {task.name}
          </Title>
          <Tag color={getStatusColor(task.status)} style={{ marginLeft: '12px' }}>
            {getStatusText(task.status)}
          </Tag>
        </div>
        <Space>
          {task.status === 'running' && (
            <Button
              type={isRealTimeMode ? 'primary' : 'default'}
              icon={<EyeOutlined />}
              onClick={toggleRealTimeMode}
            >
              {isRealTimeMode ? '关闭实时监控' : '开启实时监控'}
            </Button>
          )}
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleStartTask}
            disabled={task.status === 'running'}
          >
            启动任务
          </Button>
          <Button
             icon={<PauseCircleOutlined />}
             onClick={handleStopTask}
             disabled={task.status !== 'running'}
           >
             停止任务
           </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteTask}
          >
            删除任务
          </Button>
        </Space>
      </div>

      {/* 标签页 */}
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="任务概览" key="overview">
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="基本信息" size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="任务名称">{task.name}</Descriptions.Item>
                  <Descriptions.Item label="描述">{task.description || '-'}</Descriptions.Item>
                  <Descriptions.Item label="触发方式">
                    {getTriggerTypeText(task.triggerType)}
                  </Descriptions.Item>
                  {task.triggerType === 'scheduled' && (
                    <Descriptions.Item label="Cron表达式">
                      <code>{task.cronExpression}</code>
                    </Descriptions.Item>
                  )}
                  <Descriptions.Item label="是否启用">
                    <Tag color={task.isEnabled ? 'green' : 'red'}>
                      {task.isEnabled ? '已启用' : '已禁用'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="创建时间">
                    {formatDate(task.createdAt)}
                  </Descriptions.Item>
                  <Descriptions.Item label="更新时间">
                    {formatDate(task.updatedAt)}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
            <Col span={12}>
              <Card title="执行配置" size="small">
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="关联脚本">
                    {task.script ? (
                      <span>{task.script.name} ({getTypeText(task.script.type as ScriptType)})</span>
                    ) : (
                      <span>脚本ID: {task.scriptId}</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="执行Agent">
                    {task.agent ? (
                      <span>{task.agent.name} ({task.agent.hostname})</span>
                    ) : (
                      <span>{task.agentId || '平台服务器'}</span>
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label="虚拟用户数">{task.config?.vus || '-'}</Descriptions.Item>
                  <Descriptions.Item label="持续时间">{task.config?.duration || '-'}</Descriptions.Item>
                  {task.config?.stages && task.config.stages.length > 0 && (
                    <Descriptions.Item label="阶段配置">
                      {task.config.stages.map((stage, index) => (
                        <div key={index}>
                          阶段{index + 1}: {stage.duration} → {stage.target} VUs
                        </div>
                      ))}
                    </Descriptions.Item>
                  )}
                  {task.config?.env && Object.keys(task.config.env).length > 0 && (
                    <Descriptions.Item label="环境变量">
                      {Object.entries(task.config.env).map(([key, value]) => (
                        <div key={key}>
                          <code>{key}={value}</code>
                        </div>
                      ))}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              </Card>
            </Col>
          </Row>

          {/* 实时监控 */}
          {task.status === 'running' && isRealTimeMode && (
            <Card title="实时监控" style={{ marginTop: '16px' }} size="small">
              <div style={{ height: '300px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '12px', fontFamily: 'monospace' }}>
                {realTimeLogs.length > 0 ? (
                  realTimeLogs.map((log, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      <span style={{ color: '#666' }}>[{log.timestamp}]</span> {log.message}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: '#999' }}>等待实时日志...</div>
                )}
              </div>
            </Card>
          )}
        </TabPane>

        <TabPane tab="执行历史" key="history">
          <Card>
            <Table
              dataSource={executions}
              loading={executionsLoading}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              columns={[
                {
                  title: '执行ID',
                  dataIndex: 'id',
                  key: 'id',
                  width: 120,
                  render: (id: string) => (
                    <code style={{ fontSize: '12px' }}>{id.substring(0, 8)}...</code>
                  )
                },
                {
                  title: '触发方式',
                  dataIndex: 'triggerType',
                  key: 'triggerType',
                  width: 100,
                  render: (type: string) => (
                    <Tag color={type === 'manual' ? 'blue' : 'orange'}>
                      {getTriggerTypeText(type)}
                    </Tag>
                  )
                },
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  width: 100,
                  render: (status: string) => (
                    <Tag color={getStatusColor(status)}>
                      {getStatusText(status)}
                    </Tag>
                  )
                },
                {
                  title: '开始时间',
                  dataIndex: 'startTime',
                  key: 'startTime',
                  width: 160,
                  render: (time: string) => time ? formatDate(time) : '-'
                },
                {
                  title: '结束时间',
                  dataIndex: 'endTime',
                  key: 'endTime',
                  width: 160,
                  render: (time: string) => time ? formatDate(time) : '-'
                },
                {
                  title: '持续时间',
                  key: 'duration',
                  width: 100,
                  render: (_, record: TaskExecution) => formatDuration(record.startTime, record.endTime)
                },
                {
                  title: '结果概览',
                  key: 'summary',
                  render: (_, record: TaskExecution) => {
                    if (record.status !== 'success' || !record.summary) return '-'
                    return (
                      <div style={{ fontSize: '12px' }}>
                        <div>平均响应: {record.summary.avgResponseTime}ms</div>
                        <div>错误率: {record.summary.errorRate}%</div>
                      </div>
                    )
                  }
                },
                {
                  title: '操作',
                  key: 'actions',
                  width: 120,
                  render: (_, record: TaskExecution) => (
                    <Space size="small">
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          setSelectedExecution(record)
                          setLogModalVisible(true)
                        }}
                      >
                        日志
                      </Button>
                      {record.status === 'success' && (
                        <Button
                          size="small"
                          icon={<DownloadOutlined />}
                          onClick={() => handleDownloadReport(record.id, task.name)}
                        >
                          报告
                        </Button>
                      )}
                    </Space>
                  )
                }
              ]}
            />
          </Card>
        </TabPane>
      </Tabs>

      {/* 日志模态框 */}
      <Modal
        title={`执行日志 - ${selectedExecution?.id?.substring(0, 8)}...`}
        open={logModalVisible}
        onCancel={() => setLogModalVisible(false)}
        footer={null}
        width={800}
      >
        {selectedExecution && (
          <div style={{ height: '400px', overflow: 'auto', backgroundColor: '#f5f5f5', padding: '12px', fontFamily: 'monospace' }}>
            {selectedExecution.logs ? (
              selectedExecution.logs.split('\n').map((line, index) => (
                <div key={index} style={{ marginBottom: '2px', fontSize: '12px' }}>
                  {line}
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#999' }}>暂无日志</div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default TaskDetail