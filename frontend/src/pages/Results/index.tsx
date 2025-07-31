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
  Progress,
  Statistic,
  DatePicker
} from 'antd'
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  MoreOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  ShareAltOutlined,
  DiffOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { resultService } from '../../services'
import { TestResult, TestResultStatus } from '../../types/result'
import { formatDuration, formatDate, formatNumber } from '../../utils'
import './index.css'

const { Title } = Typography
const { Search } = Input
const { Option } = Select
const { RangePicker } = DatePicker

interface ResultsPageState {
  results: TestResult[]
  loading: boolean
  total: number
  current: number
  pageSize: number
  searchText: string
  statusFilter: TestResultStatus | 'all'
  dateRange: [string, string] | null
  selectedRowKeys: string[]
}

const Results: React.FC = () => {
  const navigate = useNavigate()
  const [state, setState] = useState<ResultsPageState>({
    results: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10,
    searchText: '',
    statusFilter: 'all',
    dateRange: null,
    selectedRowKeys: []
  })

  useEffect(() => {
    loadResults()
  }, [state.current, state.pageSize, state.searchText, state.statusFilter, state.dateRange])

  const loadResults = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const params = {
        page: state.current,
        limit: state.pageSize,
        search: state.searchText || undefined,
        status: state.statusFilter !== 'all' ? state.statusFilter : undefined,
        startDate: state.dateRange?.[0],
        endDate: state.dateRange?.[1]
      }
      
      const response = await resultService.getResults(params)
      setState(prev => ({
        ...prev,
        results: response.data,
        total: response.total
      }))
    } catch (error: any) {
      message.error(error.message || '加载测试结果失败')
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleSearch = (value: string) => {
    setState(prev => ({ ...prev, searchText: value, current: 1 }))
  }

  const handleStatusFilter = (value: TestResultStatus | 'all') => {
    setState(prev => ({ ...prev, statusFilter: value, current: 1 }))
  }

  const handleDateRangeChange = (dates: any, dateStrings: [string, string]) => {
    setState(prev => ({ ...prev, dateRange: dateStrings[0] && dateStrings[1] ? dateStrings : null, current: 1 }))
  }

  const handleTableChange = (pagination: any) => {
    setState(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  const handleSelectChange = (selectedRowKeys: React.Key[]) => {
    setState(prev => ({ ...prev, selectedRowKeys: selectedRowKeys as string[] }))
  }

  const handleDownloadReport = async (result: TestResult) => {
    try {
      const blob = await resultService.downloadReport(result.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${result.taskName}-report.html`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      message.success('报告下载成功')
    } catch (error: any) {
      message.error(error.message || '下载失败')
    }
  }

  const handleDownloadRawData = async (result: TestResult) => {
    try {
      const blob = await resultService.getRawData(result.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${result.taskName}-raw-data.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      message.success('原始数据下载成功')
    } catch (error: any) {
      message.error(error.message || '下载失败')
    }
  }

  const handleShare = async (result: TestResult) => {
    try {
      const shareLink = await resultService.getShareLink(result.id)
      await navigator.clipboard.writeText(shareLink.url)
      message.success('分享链接已复制到剪贴板')
    } catch (error: any) {
      message.error(error.message || '生成分享链接失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await resultService.deleteResult(id)
      message.success('删除成功')
      loadResults()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  const handleBatchDelete = async () => {
    try {
      await resultService.batchDelete(state.selectedRowKeys)
      message.success('批量删除成功')
      setState(prev => ({ ...prev, selectedRowKeys: [] }))
      loadResults()
    } catch (error: any) {
      message.error(error.message || '批量删除失败')
    }
  }

  const handleBatchExport = async () => {
    try {
      const blob = await resultService.batchExport(state.selectedRowKeys)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `test-results-${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      message.success('批量导出成功')
    } catch (error: any) {
      message.error(error.message || '批量导出失败')
    }
  }

  const getStatusColor = (status: TestResultStatus) => {
    switch (status) {
      case 'success': return 'success'
      case 'failed': return 'error'
      case 'partial': return 'warning'
      case 'running': return 'processing'
      default: return 'default'
    }
  }

  const getStatusText = (status: TestResultStatus) => {
    switch (status) {
      case 'success': return '成功'
      case 'failed': return '失败'
      case 'partial': return '部分成功'
      case 'running': return '运行中'
      default: return status
    }
  }

  const getStatusIcon = (status: TestResultStatus) => {
    switch (status) {
      case 'success': return <CheckCircleOutlined />
      case 'failed': return <ExclamationCircleOutlined />
      case 'partial': return <ExclamationCircleOutlined />
      case 'running': return <ClockCircleOutlined />
      default: return <ClockCircleOutlined />
    }
  }

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return '#52c41a'
    if (rate >= 80) return '#faad14'
    return '#ff4d4f'
  }

  const getActionMenu = (record: TestResult) => (
    <Menu>
      <Menu.Item
        key="view"
        icon={<EyeOutlined />}
        onClick={() => navigate(`/results/${record.id}`)}
      >
        查看详情
      </Menu.Item>
      <Menu.Item
        key="compare"
        icon={<DiffOutlined />}
        onClick={() => navigate(`/results/compare?ids=${record.id}`)}
      >
        对比分析
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="download-report"
        icon={<FileTextOutlined />}
        onClick={() => handleDownloadReport(record)}
      >
        下载报告
      </Menu.Item>
      <Menu.Item
        key="download-raw"
        icon={<DownloadOutlined />}
        onClick={() => handleDownloadRawData(record)}
      >
        下载原始数据
      </Menu.Item>
      <Menu.Item
        key="share"
        icon={<ShareAltOutlined />}
        onClick={() => handleShare(record)}
      >
        分享结果
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item
        key="delete"
        icon={<DeleteOutlined />}
        danger
        onClick={() => {
          Modal.confirm({
            title: '确定要删除这个测试结果吗？',
            content: '删除后无法恢复',
            onOk: () => handleDelete(record.id)
          })
        }}
      >
        删除结果
      </Menu.Item>
    </Menu>
  )

  const columns = [
    {
      title: '任务名称',
      dataIndex: 'taskName',
      key: 'taskName',
      render: (text: string, record: TestResult) => (
        <Space>
          <TrophyOutlined />
          <span className="result-name" onClick={() => navigate(`/results/${record.id}`)}>
            {text}
          </span>
        </Space>
      )
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: TestResultStatus) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {getStatusText(status)}
        </Tag>
      )
    },
    {
      title: '成功率',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate: number) => (
        <Progress
          percent={rate}
          size="small"
          strokeColor={getSuccessRateColor(rate)}
          format={percent => `${percent}%`}
        />
      )
    },
    {
      title: '平均响应时间',
      dataIndex: 'avgResponseTime',
      key: 'avgResponseTime',
      render: (time: number) => `${time}ms`
    },
    {
      title: '总请求数',
      dataIndex: 'totalRequests',
      key: 'totalRequests',
      render: (count: number) => formatNumber(count)
    },
    {
      title: '错误数',
      dataIndex: 'errorCount',
      key: 'errorCount',
      render: (count: number) => (
        <span style={{ color: count > 0 ? '#ff4d4f' : '#52c41a' }}>
          {formatNumber(count)}
        </span>
      )
    },
    {
      title: '持续时间',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => formatDuration(duration)
    },
    {
      title: '完成时间',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date: string) => formatDate(date)
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: TestResult) => (
        <Space>
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/results/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="下载报告">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadReport(record)}
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
    onChange: handleSelectChange
  }

  const batchActions = (
    <Space>
      <Button
        icon={<DownloadOutlined />}
        onClick={handleBatchExport}
        disabled={state.selectedRowKeys.length === 0}
      >
        批量导出
      </Button>
      <Popconfirm
        title="确定要批量删除选中的测试结果吗？"
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
    total: state.results.length,
    success: state.results.filter(r => r.status === 'success').length,
    failed: state.results.filter(r => r.status === 'failed').length,
    partial: state.results.filter(r => r.status === 'partial').length
  }

  return (
    <div className="results-container">
      <Card className="results-header-card">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>测试结果</Title>
          </Col>
          <Col>
            <Button
              icon={<DiffOutlined />}
              onClick={() => navigate('/results/compare')}
            >
              结果对比
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="results-stats-row">
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="总数"
              value={stats.total}
              prefix={<BarChartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="成功"
              value={stats.success}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="失败"
              value={stats.failed}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="stat-card">
            <Statistic
              title="部分成功"
              value={stats.partial}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="results-filter-card">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
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
              <Option value="success">成功</Option>
              <Option value="failed">失败</Option>
              <Option value="partial">部分成功</Option>
              <Option value="running">运行中</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              onChange={handleDateRangeChange}
              placeholder={['开始日期', '结束日期']}
            />
          </Col>
          <Col xs={24} sm={24} md={8}>
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

      <Card className="results-table-card">
        <Table
          columns={columns}
          dataSource={state.results}
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

export default Results