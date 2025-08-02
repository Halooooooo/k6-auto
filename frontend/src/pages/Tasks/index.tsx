import React, { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Space,
  Input,
  Select,
  Tag,
  Modal,
  message,
  Popconfirm,
  Typography,
  Card,
  Row,
  Col,
  Progress,
  Tooltip,
  Dropdown,
  Menu
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  MoreOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { taskService } from '../../services'
import { Task, TaskStatus, TaskTriggerType } from '../../types/task'
import { formatDuration, formatDate } from '../../utils'
import './index.css'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

interface TasksPageState {
  tasks: Task[]
  loading: boolean
  total: number
  current: number
  pageSize: number
  searchText: string
  statusFilter: TaskStatus | 'all'
  triggerFilter: TaskTriggerType | 'all'
}

const Tasks: React.FC = () => {
  const navigate = useNavigate()
  const [state, setState] = useState<TasksPageState>({
    tasks: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10,
    searchText: '',
    statusFilter: 'all',
    triggerFilter: 'all'
  })

  useEffect(() => {
    loadTasks()
  }, [state.current, state.pageSize, state.searchText, state.statusFilter, state.triggerFilter])

  const loadTasks = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const params = {
        page: state.current,
        limit: state.pageSize,
        search: state.searchText || undefined,
        status: state.statusFilter !== 'all' ? state.statusFilter : undefined,
        trigger: state.triggerFilter !== 'all' ? state.triggerFilter : undefined
      }
      
      const response = await taskService.getTasks(params)
      setState(prev => ({
        ...prev,
        tasks: response.data,
        total: response.total
      }))
    } catch (error: any) {
      message.error(error.message || '加载任务列表失败')
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleSearch = (value: string) => {
    setState(prev => ({ ...prev, searchText: value, current: 1 }))
  }

  const handleStatusFilter = (value: TaskStatus | 'all') => {
    setState(prev => ({ ...prev, statusFilter: value, current: 1 }))
  }

  const handleTriggerFilter = (value: TaskTriggerType | 'all') => {
    setState(prev => ({ ...prev, triggerFilter: value, current: 1 }))
  }

  const handleTableChange = (pagination: any) => {
    setState(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  const handleStart = async (id: string) => {
    try {
      await taskService.startTask(id)
      message.success('任务启动成功')
      loadTasks()
    } catch (error: any) {
      message.error(error.message || '启动失败')
    }
  }

  const handlePause = async (id: string) => {
    try {
      await taskService.pauseTask(id)
      message.success('任务暂停成功')
      loadTasks()
    } catch (error: any) {
      message.error(error.message || '暂停失败')
    }
  }

  const handleStop = async (id: string) => {
    try {
      await taskService.stopTask(id)
      message.success('任务停止成功')
      loadTasks()
    } catch (error: any) {
      message.error(error.message || '停止失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await taskService.deleteTask(id)
      message.success('删除成功')
      loadTasks()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  const handleDownloadReport = async (task: Task) => {
    try {
      const blob = await taskService.downloadReport(task.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${task.name}-report.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      message.success('报告下载成功')
    } catch (error: any) {
      message.error(error.message || '下载失败')
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'running': return 'processing'
      case 'completed': return 'success'
      case 'failed': return 'error'
      case 'paused': return 'warning'
      case 'pending': return 'default'
      case 'cancelled': return 'default'
      default: return 'default'
    }
  }

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case 'running': return '运行中'
      case 'completed': return '已完成'
      case 'failed': return '失败'
      case 'paused': return '已暂停'
      case 'pending': return '等待中'
      case 'cancelled': return '已取消'
      default: return status
    }
  }

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'running': return <SyncOutlined spin />
      case 'completed': return <CheckCircleOutlined />
      case 'failed': return <ExclamationCircleOutlined />
      case 'paused': return <PauseCircleOutlined />
      case 'pending': return <ClockCircleOutlined />
      case 'cancelled': return <StopOutlined />
      default: return <ClockCircleOutlined />
    }
  }

  const getTriggerText = (trigger: TaskTriggerType) => {
    switch (trigger) {
      case 'manual': return '手动'
      case 'scheduled': return '定时'
      case 'webhook': return 'Webhook'
      case 'api': return 'API'
      default: return trigger
    }
  }

  const getTriggerColor = (trigger: TaskTriggerType) => {
    switch (trigger) {
      case 'manual': return 'blue'
      case 'scheduled': return 'green'
      case 'webhook': return 'orange'
      case 'api': return 'purple'
      default: return 'default'
    }
  }

  const getActionMenu = (record: Task) => (
    <Menu>
      <Menu.Item
        key="view"
        icon={<EyeOutlined />}
        onClick={() => navigate(`/tasks/${record.id}`)}
      >
        查看详情
      </Menu.Item>
      {(record.status === 'pending' || record.status === 'completed' || record.status === 'failed') && (
        <Menu.Item
          key="edit"
          icon={<EditOutlined />}
          onClick={() => navigate(`/tasks/${record.id}/edit`)}
        >
          编辑任务
        </Menu.Item>
      )}
      {record.status === 'completed' && (
        <Menu.Item
          key="download"
          icon={<DownloadOutlined />}
          onClick={() => handleDownloadReport(record)}
        >
          下载报告
        </Menu.Item>
      )}
      <Menu.Divider />
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        danger
        onClick={() => {
          Modal.confirm({
            title: '确定要删除这个任务吗？',
            content: '删除后无法恢复',
            onOk: () => handleDelete(record.id)
          })
        }}
      >
        删除任务
      </Menu.Item>
    </Menu>
  )

  const getNextExecutionTime = (task: Task) => {
    if (task.triggerType !== 'scheduled' || !task.cronExpression) {
      return '-'
    }
    // 这里应该根据cron表达式计算下次执行时间
    // 简化处理，实际应该使用cron库计算
    return task.scheduledAt ? formatDate(task.scheduledAt) : '计算中...'
  }

  const getExecutionEnvironment = (task: Task) => {
    if (task.agentId) {
      return (
        <Tooltip title={`Agent ID: ${task.agentId}`}>
          <Tag color="blue">Agent执行</Tag>
        </Tooltip>
      )
    }
    return <Tag color="default">平台执行</Tag>
  }

  const getResultSummary = (task: Task) => {
    if (task.status !== 'completed' || !task.logs) {
      return '-'
    }
    // 简化的结果摘要，实际应该解析k6输出
    return (
      <Tooltip title="点击查看详细报告">
        <span className="result-summary">
          平均响应: 120ms, 错误率: 0.1%
        </span>
      </Tooltip>
    )
  }

  const columns = [
    {
      title: '任务名称/ID',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: Task) => (
        <div>
          <div 
            className="task-name" 
            onClick={() => navigate(`/tasks/${record.id}`)}
            style={{ cursor: 'pointer', color: '#1890ff', fontWeight: 500 }}
          >
            {text}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>ID: {record.id.slice(0, 8)}...</div>
        </div>
      )
    },
    {
      title: '关联脚本',
      dataIndex: 'script',
      key: 'script',
      width: 150,
      render: (script: any, record: Task) => (
        <Tooltip title={`脚本ID: ${record.scriptId}`}>
          <span>{script?.name || '未知脚本'}</span>
        </Tooltip>
      )
    },
    {
      title: '触发类型',
      dataIndex: 'triggerType',
      key: 'triggerType',
      width: 100,
      render: (trigger: TaskTriggerType, record: Task) => (
        <div>
          <Tag color={getTriggerColor(trigger)}>{getTriggerText(trigger)}</Tag>
          {trigger === 'scheduled' && (
            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
              {record.isEnabled ? '已启用' : '已禁用'}
            </div>
          )}
        </div>
      )
    },
    {
      title: '执行环境',
      key: 'executionEnvironment',
      width: 120,
      render: (_, record: Task) => getExecutionEnvironment(record)
    },
    {
      title: '定时配置',
      key: 'scheduleConfig',
      width: 150,
      render: (_, record: Task) => {
        if (record.triggerType !== 'scheduled') {
          return '-'
        }
        return (
          <div>
            <div style={{ fontSize: '12px' }}>
              {record.cronExpression || '未配置'}
            </div>
            <div style={{ fontSize: '11px', color: '#666' }}>
              下次: {getNextExecutionTime(record)}
            </div>
          </div>
        )
      }
    },
    {
      title: '最近执行状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: TaskStatus) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '执行时间',
      key: 'executionTime',
      width: 180,
      render: (_, record: Task) => (
        <div>
          <div style={{ fontSize: '12px' }}>
            开始: {record.startedAt ? formatDate(record.startedAt) : '-'}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.completedAt ? (
              `结束: ${formatDate(record.completedAt)}`
            ) : record.startedAt ? (
              `持续: ${formatDuration(Date.now() - new Date(record.startedAt).getTime())}`
            ) : (
              '未开始'
            )}
          </div>
        </div>
      )
    },
    {
      title: '结果概览',
      key: 'resultSummary',
      width: 150,
      render: (_, record: Task) => getResultSummary(record)
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record: Task) => (
        <Space>
          {(record.status === 'pending' || record.triggerType === 'manual') && (
            <Tooltip title="立即运行">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStart(record.id)}
                size="small"
              />
            </Tooltip>
          )}
          {record.status === 'running' && (
            <Tooltip title="停止">
              <Button
                type="text"
                icon={<StopOutlined />}
                onClick={() => handleStop(record.id)}
                size="small"
                danger
              />
            </Tooltip>
          )}
          <Tooltip title="查看历史">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/tasks/${record.id}/history`)}
              size="small"
            />
          </Tooltip>
          <Dropdown overlay={getActionMenu(record)} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} size="small" />
          </Dropdown>
        </Space>
      )
    }
  ]

  return (
    <div className="tasks-container">
      <Card className="tasks-header-card">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>任务管理</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/tasks/new')}
            >
              创建任务
            </Button>
          </Col>
        </Row>
      </Card>

      <Card className="tasks-filter-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索任务名称"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="状态筛选"
              style={{ width: '100%' }}
              value={state.statusFilter}
              onChange={handleStatusFilter}
            >
              <Option value="all">全部状态</Option>
              <Option value="pending">等待中</Option>
              <Option value="running">运行中</Option>
              <Option value="paused">已暂停</Option>
              <Option value="completed">已完成</Option>
              <Option value="failed">失败</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="触发方式"
              style={{ width: '100%' }}
              value={state.triggerFilter}
              onChange={handleTriggerFilter}
            >
              <Option value="all">全部方式</Option>
              <Option value="manual">手动</Option>
              <Option value="scheduled">定时</Option>
              <Option value="webhook">Webhook</Option>
              <Option value="api">API</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              icon={<SyncOutlined />}
              onClick={loadTasks}
              style={{ width: '100%' }}
            >
              刷新
            </Button>
          </Col>
        </Row>
      </Card>

      <Card className="tasks-table-card">
        <Table
          columns={columns}
          dataSource={state.tasks}
          rowKey="id"
          loading={state.loading}
          pagination={{
            current: state.current,
            pageSize: state.pageSize,
            total: state.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  )
}

export default Tasks