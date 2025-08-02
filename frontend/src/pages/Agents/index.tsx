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
  Tooltip,
  Dropdown,
  Menu,
  Badge,
  Progress,
  Statistic
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
  MoreOutlined,
  EyeOutlined,
  SettingOutlined,
  HeartOutlined,
  CloudServerOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  DisconnectOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { agentService } from '../../services'
import { Agent, AgentStatus } from '../../types/agent'
import { formatDate, formatFileSize } from '../../utils'
import './index.css'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

interface AgentsPageState {
  agents: Agent[]
  loading: boolean
  total: number
  current: number
  pageSize: number
  searchText: string
  statusFilter: AgentStatus | 'all'
  selectedRowKeys: string[]
}

const Agents: React.FC = () => {
  const navigate = useNavigate()
  const [state, setState] = useState<AgentsPageState>({
    agents: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10,
    searchText: '',
    statusFilter: 'all',
    selectedRowKeys: []
  })

  useEffect(() => {
    loadAgents()
  }, [state.current, state.pageSize, state.searchText, state.statusFilter])

  const loadAgents = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const params = {
        page: state.current,
        limit: state.pageSize,
        search: state.searchText || undefined,
        status: state.statusFilter !== 'all' ? state.statusFilter : undefined
      }
      
      const response = await agentService.getAgents(params)
      setState(prev => ({
        ...prev,
        agents: response.data,
        total: response.total
      }))
    } catch (error: any) {
      message.error(error.message || '加载Agent列表失败')
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleSearch = (value: string) => {
    setState(prev => ({ ...prev, searchText: value, current: 1 }))
  }

  const handleStatusFilter = (value: AgentStatus | 'all') => {
    setState(prev => ({ ...prev, statusFilter: value, current: 1 }))
  }

  const handleTableChange = (pagination: any, filters: any, sorter: any, extra: any) => {
    setState(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
    
    if (extra.action === 'paginate') {
      // 分页时清空选择
      setState(prev => ({ ...prev, selectedRowKeys: [] }))
    }
  }

  const handleSelectChange = (selectedRowKeys: React.Key[]) => {
    setState(prev => ({ ...prev, selectedRowKeys: selectedRowKeys as string[] }))
  }

  const handleEnable = async (id: string) => {
    try {
      await agentService.enableAgent(id)
      message.success('启用成功')
      loadAgents()
    } catch (error: any) {
      message.error(error.message || '启用失败')
    }
  }

  const handleDisable = async (id: string) => {
    try {
      await agentService.disableAgent(id)
      message.success('禁用成功')
      loadAgents()
    } catch (error: any) {
      message.error(error.message || '禁用失败')
    }
  }

  const handleRestart = async (id: string) => {
    try {
      await agentService.restartAgent(id)
      message.success('重启成功')
      loadAgents()
    } catch (error: any) {
      message.error(error.message || '重启失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await agentService.deleteAgent(id)
      message.success('删除成功')
      loadAgents()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  const handleBatchEnable = async () => {
    try {
      await agentService.batchEnable(state.selectedRowKeys)
      message.success('批量启用成功')
      setState(prev => ({ ...prev, selectedRowKeys: [] }))
      loadAgents()
    } catch (error: any) {
      message.error(error.message || '批量启用失败')
    }
  }

  const handleBatchDisable = async () => {
    try {
      await agentService.batchDisable(state.selectedRowKeys)
      message.success('批量禁用成功')
      setState(prev => ({ ...prev, selectedRowKeys: [] }))
      loadAgents()
    } catch (error: any) {
      message.error(error.message || '批量禁用失败')
    }
  }

  const handleBatchDelete = async () => {
    try {
      await agentService.batchDelete(state.selectedRowKeys)
      message.success('批量删除成功')
      setState(prev => ({ ...prev, selectedRowKeys: [] }))
      loadAgents()
    } catch (error: any) {
      message.error(error.message || '批量删除失败')
    }
  }

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case 'online': return 'success'
      case 'offline': return 'default'
      case 'busy': return 'processing'
      case 'error': return 'error'
      case 'maintenance': return 'warning'
      default: return 'default'
    }
  }

  const getStatusText = (status: AgentStatus) => {
    switch (status) {
      case 'online': return '在线'
      case 'offline': return '离线'
      case 'busy': return '忙碌'
      case 'error': return '错误'
      case 'maintenance': return '维护中'
      default: return status
    }
  }

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'online': return <CheckCircleOutlined />
      case 'offline': return <DisconnectOutlined />
      case 'busy': return <ClockCircleOutlined />
      case 'error': return <ExclamationCircleOutlined />
      case 'maintenance': return <SettingOutlined />
      default: return <ClockCircleOutlined />
    }
  }

  const getActionMenu = (record: Agent) => (
    <Menu>
      <Menu.Item
        key="view"
        icon={<EyeOutlined />}
        onClick={() => navigate(`/agents/${record.id}`)}
      >
        查看详情
      </Menu.Item>
      <Menu.Item
        key="edit"
        icon={<EditOutlined />}
        onClick={() => navigate(`/agents/${record.id}/edit`)}
      >
        编辑配置
      </Menu.Item>
      <Menu.Divider />
      {record.status === 'offline' ? (
        <Menu.Item
          key="enable"
          icon={<PlayCircleOutlined />}
          onClick={() => handleEnable(record.id)}
        >
          启用Agent
        </Menu.Item>
      ) : (
        <Menu.Item
          key="disable"
          icon={<PauseCircleOutlined />}
          onClick={() => handleDisable(record.id)}
        >
          禁用Agent
        </Menu.Item>
      )}
      <Menu.Item
        key="restart"
        icon={<ReloadOutlined />}
        onClick={() => handleRestart(record.id)}
      >
        重启Agent
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        danger
        onClick={() => {
          Modal.confirm({
            title: '确定要删除这个Agent吗？',
            content: '删除后无法恢复',
            onOk: () => handleDelete(record.id)
          })
        }}
      >
        删除Agent
      </Menu.Item>
    </Menu>
  )

  const columns = [
    {
      title: 'Agent名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Agent) => (
        <Space>
          <CloudServerOutlined />
          <span className="agent-name" onClick={() => navigate(`/agents/${record.id}`)}>
            {text}
          </span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: AgentStatus) => (
        <Badge
          status={getStatusColor(status) as any}
          text={
            <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
              {getStatusText(status)}
            </Tag>
          }
        />
      )
    },
    {
      title: 'IP地址',
      dataIndex: 'ipAddress',
      key: 'ipAddress'
    },
    {
      title: '端口',
      dataIndex: 'port',
      key: 'port'
    },
    {
      title: 'CPU使用率',
      dataIndex: 'cpuUsage',
      key: 'cpuUsage',
      render: (usage: number) => (
        <Progress
          percent={Math.round(usage)}
          size="small"
          status={usage > 80 ? 'exception' : usage > 60 ? 'active' : 'success'}
          format={percent => `${percent}%`}
        />
      )
    },
    {
      title: '内存使用率',
      dataIndex: 'memoryUsage',
      key: 'memoryUsage',
      render: (usage: number) => (
        <Progress
          percent={Math.round(usage)}
          size="small"
          status={usage > 80 ? 'exception' : usage > 60 ? 'active' : 'success'}
          format={percent => `${percent}%`}
        />
      )
    },
    {
      title: '当前任务',
      dataIndex: 'currentTasks',
      key: 'currentTasks',
      render: (tasks: number, record: Agent) => (
        <span>{tasks} / {record.maxTasks}</span>
      )
    },
    {
      title: '最后心跳',
      dataIndex: 'lastHeartbeat',
      key: 'lastHeartbeat',
      render: (time: string) => time ? formatDate(time) : '-'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Agent) => (
        <Space>
          {record.status === 'offline' ? (
            <Tooltip title="启用">
              <Button
                type="text"
                icon={<PlayCircleOutlined />}
                onClick={() => handleEnable(record.id)}
              />
            </Tooltip>
          ) : (
            <Tooltip title="禁用">
              <Button
                type="text"
                icon={<PauseCircleOutlined />}
                onClick={() => handleDisable(record.id)}
              />
            </Tooltip>
          )}
          <Tooltip title="重启">
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => handleRestart(record.id)}
            />
          </Tooltip>
          <Dropdown overlay={getActionMenu(record)} trigger={['click']}>
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      )
    }
  ]

  const rowSelection = {
    selectedRowKeys: state.selectedRowKeys,
    onChange: handleSelectChange,
    getCheckboxProps: (record: Agent) => ({
      disabled: record.status === 'busy'
    })
  }

  const batchActions = (
    <Space>
      <Button
        icon={<PlayCircleOutlined />}
        onClick={handleBatchEnable}
        disabled={state.selectedRowKeys.length === 0}
      >
        批量启用
      </Button>
      <Button
        icon={<PauseCircleOutlined />}
        onClick={handleBatchDisable}
        disabled={state.selectedRowKeys.length === 0}
      >
        批量禁用
      </Button>
      <Popconfirm
        title="确定要批量删除选中的Agent吗？"
        onConfirm={handleBatchDelete}
        disabled={state.selectedRowKeys.length === 0}
      >
        <Button
          danger
          icon={<DeleteOutlined />}
          disabled={state.selectedRowKeys.length === 0}
        >
          批量删除
        </Button>
      </Popconfirm>
    </Space>
  )

  // 统计数据
  const stats = {
    total: state.agents.length,
    online: state.agents.filter(a => a.status === 'online').length,
    busy: state.agents.filter(a => a.status === 'busy').length,
    offline: state.agents.filter(a => a.status === 'offline').length
  }

  return (
    <div className="agents-container">
      <Card className="agents-header-card">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>Agent管理</Title>
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/agents/create')}
            >
              添加Agent
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="agents-stats-row">
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="总数"
              value={stats.total}
              prefix={<CloudServerOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="在线"
              value={stats.online}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="忙碌"
              value={stats.busy}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="离线"
              value={stats.offline}
              prefix={<DisconnectOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="agents-filter-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索Agent名称或IP"
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
              <Option value="online">在线</Option>
              <Option value="offline">离线</Option>
              <Option value="busy">忙碌</Option>
              <Option value="error">错误</Option>
              <Option value="maintenance">维护中</Option>
            </Select>
          </Col>
          <Col xs={24} sm={24} md={12}>
            {state.selectedRowKeys.length > 0 && (
              <div className="batch-actions">
                <span className="selected-count">
                  已选择 {state.selectedRowKeys.length} 项
                </span>
                {batchActions}
              </div>
            )}
          </Col>
        </Row>
      </Card>

      <Card className="agents-table-card">
        <Table
          columns={columns}
          dataSource={state.agents}
          rowKey="id"
          loading={state.loading}
          rowSelection={rowSelection}
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

export default Agents