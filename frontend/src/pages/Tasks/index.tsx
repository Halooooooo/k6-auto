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

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Task) => (
        <span className="task-name" onClick={() => navigate(`/tasks/${record.id}`)}>
          {text}
        </span>
      )
    },
    {
      title: '脚本',
      dataIndex: 'scriptName',
      key: 'scriptName'
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TaskStatus) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '触发方式',
      dataIndex: 'trigger',
      key: 'trigger',
      render: (trigger: TaskTriggerType) => (
        <Tag color={getTriggerColor(trigger)}>{getTriggerText(trigger)}</Tag>
      )
    },
    {
      title: '进度',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number, record: Task) => {
        if (record.status === 'running') {
          return <Progress percent={progress} size="small" status="active" />
        }
        if (record.status === 'completed') {
          return <Progress percent={100} size="small" status="success" />
        }
        if (record.status === 'failed') {
          return <Progress percent={progress} size="small" status="exception" />
        }
        return <Progress percent={progress} size="small" />
      }
    },
    {
      title: '持续时间',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => duration ? formatDuration(duration) : '-'
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date)
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Task) => (
        <Space>
          {record.status === 'pending' && (
            <Tooltip title="启动">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStart(record.id)}
              />
            </Tooltip>
          )}
          {record.status === 'running' && (
            <>
              <Tooltip title="暂停">
                <Button
                  type="text"
                  icon={<PauseCircleOutlined />}
                  onClick={() => handlePause(record.id)}
                />
              </Tooltip>
              <Tooltip title="停止">
                <Button
                  type="text"
                  icon={<StopOutlined />}
                  onClick={() => handleStop(record.id)}
                />
              </Tooltip>
            </>
          )}
          {record.status === 'paused' && (
            <Tooltip title="继续">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                onClick={() => handleStart(record.id)}
              />
            </Tooltip>
          )}
          <Dropdown overlay={getActionMenu(record)} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
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
              onClick={() => navigate('/tasks/create')}
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