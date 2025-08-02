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
  Form,
  Input,
  Select,
  Spin
} from 'antd'
import {
  EditOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  HistoryOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { scriptService } from '../../../services'
import './index.css'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { TextArea } = Input
const { Option } = Select

interface Script {
  id: string
  name: string
  description: string
  content: string
  language: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
  author: string | { username?: string; name?: string; [key: string]: any }
  version: string
  tags: string[]
}

interface ExecutionHistory {
  id: string
  executedAt: string
  status: 'success' | 'failed' | 'running'
  duration: number
  result: string
}

const ScriptDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [script, setScript] = useState<Script | null>(null)
  const [loading, setLoading] = useState(true)
  const [executing, setExecuting] = useState(false)
  const [executionHistory, setExecutionHistory] = useState<ExecutionHistory[]>([])
  const [executeModalVisible, setExecuteModalVisible] = useState(false)
  const [executeForm] = Form.useForm()

  useEffect(() => {
    if (id) {
      fetchScriptDetail()
      fetchExecutionHistory()
    }
  }, [id])

  const fetchScriptDetail = async () => {
    try {
      setLoading(true)
      const response = await scriptService.getScript(id!)
      setScript(response.data)
    } catch (error) {
      message.error('获取脚本详情失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchExecutionHistory = async () => {
    try {
      const response = await scriptService.getExecutionHistory(id!)
      setExecutionHistory(response.data)
    } catch (error) {
      console.error('获取执行历史失败:', error)
    }
  }

  const handleExecute = async (values: any) => {
    try {
      setExecuting(true)
      await scriptService.executeScript(id!, values)
      message.success('脚本执行成功')
      setExecuteModalVisible(false)
      executeForm.resetFields()
      fetchExecutionHistory()
    } catch (error) {
      message.error('脚本执行失败')
    } finally {
      setExecuting(false)
    }
  }

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个脚本吗？此操作不可恢复。',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await scriptService.deleteScript(id!)
          message.success('脚本删除成功')
          navigate('/scripts')
        } catch (error) {
          message.error('脚本删除失败')
        }
      }
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green'
      case 'inactive': return 'red'
      default: return 'default'
    }
  }

  const getExecutionStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'green'
      case 'failed': return 'red'
      case 'running': return 'blue'
      default: return 'default'
    }
  }

  const executionColumns = [
    {
      title: '执行时间',
      dataIndex: 'executedAt',
      key: 'executedAt',
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getExecutionStatusColor(status)}>
          {status === 'success' ? '成功' : status === 'failed' ? '失败' : '运行中'}
        </Tag>
      )
    },
    {
      title: '持续时间',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => `${duration}ms`
    },
    {
      title: '结果',
      dataIndex: 'result',
      key: 'result',
      ellipsis: true
    }
  ]

  if (loading) {
    return (
      <div className="script-detail-loading">
        <Spin size="large" />
      </div>
    )
  }

  if (!script) {
    return (
      <div className="script-detail-error">
        <Title level={3}>脚本不存在</Title>
        <Button onClick={() => navigate('/scripts')}>返回脚本列表</Button>
      </div>
    )
  }

  return (
    <div className="script-detail">
      <Card className="script-detail-header">
        <div className="header-content">
          <div className="header-left">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/scripts')}
              className="back-button"
            >
              返回
            </Button>
            <div className="script-info">
              <Title level={2} className="script-title">{script.name}</Title>
              <Space>
                <Tag color={getStatusColor(script.status)}>
                  {script.status === 'active' ? '活跃' : '非活跃'}
                </Tag>
                <Text type="secondary">版本 {script.version}</Text>
                <Text type="secondary">作者: {typeof script.author === 'object' ? script.author?.username || script.author?.name || '未知' : script.author}</Text>
              </Space>
            </div>
          </div>
          <div className="header-actions">
            <Space>
              <Button 
                type="primary" 
                icon={<PlayCircleOutlined />}
                onClick={() => setExecuteModalVisible(true)}
              >
                执行脚本
              </Button>
              <Button 
                icon={<EditOutlined />}
                onClick={() => navigate(`/scripts/${id}/edit`)}
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

      <div className="script-detail-content">
        <Tabs defaultActiveKey="info">
          <TabPane tab={<span><FileTextOutlined />基本信息</span>} key="info">
            <Card>
              <Descriptions column={2} bordered>
                <Descriptions.Item label="脚本名称">{script.name}</Descriptions.Item>
                <Descriptions.Item label="语言">{script.language}</Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={getStatusColor(script.status)}>
                    {script.status === 'active' ? '活跃' : '非活跃'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="版本">{script.version}</Descriptions.Item>
                <Descriptions.Item label="作者">{typeof script.author === 'object' ? script.author?.username || script.author?.name || '未知' : script.author}</Descriptions.Item>
                <Descriptions.Item label="创建时间">
                  {new Date(script.createdAt).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="更新时间">
                  {new Date(script.updatedAt).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="标签">
                  {script.tags.map(tag => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  ))}
                </Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>
                  {script.description}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </TabPane>
          
          <TabPane tab={<span><SettingOutlined />脚本内容</span>} key="content">
            <Card>
              <pre className="script-content">
                <code>{script.content}</code>
              </pre>
            </Card>
          </TabPane>
          
          <TabPane tab={<span><HistoryOutlined />执行历史</span>} key="history">
            <Card>
              <Table
                columns={executionColumns}
                dataSource={executionHistory}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 条记录`
                }}
              />
            </Card>
          </TabPane>
        </Tabs>
      </div>

      <Modal
        title="执行脚本"
        open={executeModalVisible}
        onCancel={() => setExecuteModalVisible(false)}
        footer={null}
      >
        <Form
          form={executeForm}
          layout="vertical"
          onFinish={handleExecute}
        >
          <Form.Item
            name="environment"
            label="执行环境"
            rules={[{ required: true, message: '请选择执行环境' }]}
          >
            <Select placeholder="选择执行环境">
              <Option value="development">开发环境</Option>
              <Option value="testing">测试环境</Option>
              <Option value="staging">预发布环境</Option>
              <Option value="production">生产环境</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="parameters"
            label="执行参数"
          >
            <TextArea 
              rows={4} 
              placeholder="输入执行参数（JSON格式）"
            />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={executing}>
                执行
              </Button>
              <Button onClick={() => setExecuteModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default ScriptDetail