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
  Upload,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  DownloadOutlined,
  UploadOutlined,
  CopyOutlined,
  FileTextOutlined,
  CodeOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { scriptService } from '../../services'
import { Script, ScriptType, ScriptStatus } from '../../types/script'
import { formatFileSize, formatDate } from '../../utils'
import './index.css'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

interface ScriptsPageState {
  scripts: Script[]
  loading: boolean
  total: number
  current: number
  pageSize: number
  searchText: string
  statusFilter: ScriptStatus | 'all'
  typeFilter: ScriptType | 'all'
}

const Scripts: React.FC = () => {
  const navigate = useNavigate()
  const [state, setState] = useState<ScriptsPageState>({
    scripts: [],
    loading: false,
    total: 0,
    current: 1,
    pageSize: 10,
    searchText: '',
    statusFilter: 'all',
    typeFilter: 'all'
  })

  useEffect(() => {
    loadScripts()
  }, [state.current, state.pageSize, state.searchText, state.statusFilter, state.typeFilter])

  const loadScripts = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const params = {
        page: state.current,
        limit: state.pageSize,
        search: state.searchText || undefined,
        isActive: state.statusFilter === 'active' ? true : state.statusFilter === 'inactive' ? false : undefined,
        type: state.typeFilter !== 'all' ? state.typeFilter : undefined
      }
      
      const response = await scriptService.getScripts(params)
      setState(prev => ({
        ...prev,
        scripts: response.data,
        total: response.total
      }))
    } catch (error: any) {
      message.error(error.message || '加载脚本列表失败')
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleSearch = (value: string) => {
    setState(prev => ({ ...prev, searchText: value, current: 1 }))
  }

  const handleStatusFilter = (value: ScriptStatus | 'all') => {
    setState(prev => ({ ...prev, statusFilter: value, current: 1 }))
  }

  const handleTypeFilter = (value: ScriptType | 'all') => {
    setState(prev => ({ ...prev, typeFilter: value, current: 1 }))
  }

  const handleTableChange = (pagination: any) => {
    setState(prev => ({
      ...prev,
      current: pagination.current,
      pageSize: pagination.pageSize
    }))
  }

  const handleDelete = async (id: string) => {
    try {
      await scriptService.deleteScript(id)
      message.success('删除成功')
      loadScripts()
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  const handleCopy = async (script: Script) => {
    try {
      await scriptService.copyScript(script.id)
      message.success('复制成功')
      loadScripts()
    } catch (error: any) {
      message.error(error.message || '复制失败')
    }
  }

  const handleDownload = async (script: Script) => {
    try {
      const blob = await scriptService.downloadScript(script.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${script.name}.js`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      message.success('下载成功')
    } catch (error: any) {
      message.error(error.message || '下载失败')
    }
  }

  const handleUpload = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('file', file)
      await scriptService.uploadScript(formData)
      message.success('上传成功')
      loadScripts()
      return false
    } catch (error: any) {
      message.error(error.message || '上传失败')
      return false
    }
  }

  const getStatusColor = (status: ScriptStatus) => {
    switch (status) {
      case 'active': return 'success'
      case 'inactive': return 'default'
      case 'draft': return 'processing'
      default: return 'default'
    }
  }

  const getStatusText = (status: ScriptStatus) => {
    switch (status) {
      case 'active': return '活跃'
      case 'inactive': return '非活跃'
      case 'draft': return '草稿'
      default: return status
    }
  }

  const getTypeColor = (type: ScriptType) => {
    switch (type) {
      case 'load_test': return 'blue'
      case 'stress_test': return 'red'
      case 'spike_test': return 'orange'
      case 'volume_test': return 'purple'
      case 'endurance_test': return 'green'
      default: return 'default'
    }
  }

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

  const columns = [
    {
      title: '脚本名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Script) => (
        <Space>
          <FileTextOutlined />
          <span className="script-name" onClick={() => navigate(`/scripts/${record.id}`)}>
            {text}
          </span>
        </Space>
      )
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: ScriptType) => (
        <Tag color={getTypeColor(type)}>{getTypeText(type)}</Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => {
        const status: ScriptStatus = isActive ? 'active' : 'inactive'
        return <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
      }
    },
    {
      title: '文件大小',
      dataIndex: 'size',
      key: 'size',
      render: (size: number) => formatFileSize(size)
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => formatDate(date)
    },
    {
      title: '更新时间',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (date: string) => formatDate(date)
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: Script) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => navigate(`/scripts/${record.id}/edit`)}
            />
          </Tooltip>
          <Tooltip title="运行">
            <Button
              type="text"
              icon={<PlayCircleOutlined />}
              onClick={() => navigate(`/tasks/new?scriptId=${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="复制">
            <Button
              type="text"
              icon={<CopyOutlined />}
              onClick={() => handleCopy(record)}
            />
          </Tooltip>
          <Tooltip title="下载">
            <Button
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个脚本吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="scripts-container">
      <Card className="scripts-header-card">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2}>脚本管理</Title>
          </Col>
          <Col>
            <Space>
              <Upload
                accept=".js,.ts"
                showUploadList={false}
                beforeUpload={handleUpload}
              >
                <Button icon={<UploadOutlined />}>上传脚本</Button>
              </Upload>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/scripts/create')}
              >
                新建脚本
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card className="scripts-filter-card">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="搜索脚本名称"
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
              <Option value="active">活跃</Option>
              <Option value="inactive">非活跃</Option>
              <Option value="draft">草稿</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="类型筛选"
              style={{ width: '100%' }}
              value={state.typeFilter}
              onChange={handleTypeFilter}
            >
              <Option value="all">全部类型</Option>
              <Option value="load_test">负载测试</Option>
              <Option value="stress_test">压力测试</Option>
              <Option value="spike_test">峰值测试</Option>
              <Option value="volume_test">容量测试</Option>
              <Option value="endurance_test">耐久测试</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      <Card className="scripts-table-card">
        <Table
          columns={columns}
          dataSource={state.scripts}
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

export default Scripts