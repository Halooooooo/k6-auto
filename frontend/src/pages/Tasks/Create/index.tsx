import React, { useState, useEffect } from 'react'
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  InputNumber,
  Switch,
  Table,
  Space,
  Divider,
  Typography,
  Alert,
  Tabs,
  Radio,
  DatePicker,
  TimePicker,
  Checkbox,
  Modal,
  message,
  Tooltip
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  ScheduleOutlined,
  SettingOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { taskService, scriptService, agentService } from '../../../services'
import { CreateTaskDto, TaskConfig, Stage, TriggerType } from '../../../types/task'
import { Script } from '../../../types/script'
import { Agent } from '../../../types/agent'
import moment from 'moment'
import './index.css'

const { Title, Text, Paragraph } = Typography
const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs

interface CreateTaskPageState {
  scripts: Script[]
  agents: Agent[]
  selectedScript: Script | null
  loading: boolean
  submitting: boolean
  previewVisible: boolean
}

const CreateTask: React.FC = () => {
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [state, setState] = useState<CreateTaskPageState>({
    scripts: [],
    agents: [],
    selectedScript: null,
    loading: false,
    submitting: false,
    previewVisible: false
  })

  const [triggerType, setTriggerType] = useState<TriggerType>('manual')
  const [executionMode, setExecutionMode] = useState<'agent' | 'platform'>('agent')
  const [durationType, setDurationType] = useState<'duration' | 'iterations'>('duration')
  const [useStages, setUseStages] = useState(false)
  const [stages, setStages] = useState<Stage[]>([{ duration: '30s', target: 10 }])
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([{ key: '', value: '' }])
  const [cronType, setCronType] = useState<'simple' | 'advanced'>('simple')

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const [scriptsResponse, agentsResponse] = await Promise.all([
        scriptService.getScripts({ page: 1, limit: 100 }),
        agentService.getAgents({ page: 1, limit: 100 })
      ])
      // 处理分页响应结构
      const scripts = Array.isArray(scriptsResponse.data) ? scriptsResponse.data : 
                     (scriptsResponse.data?.data || scriptsResponse || [])
      const agents = Array.isArray(agentsResponse.data) ? agentsResponse.data : 
                    (agentsResponse.data?.data || agentsResponse || [])
      
      setState(prev => ({
        ...prev,
        scripts: scripts,
        agents: agents
      }))
    } catch (error: any) {
      message.error('加载数据失败：' + error.message)
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleScriptChange = (scriptId: string) => {
    const script = state.scripts.find(s => s.id === scriptId)
    setState(prev => ({ ...prev, selectedScript: script || null }))
  }

  const handlePreviewScript = () => {
    if (state.selectedScript) {
      setState(prev => ({ ...prev, previewVisible: true }))
    }
  }

  const addStage = () => {
    setStages([...stages, { duration: '30s', target: 10 }])
  }

  const removeStage = (index: number) => {
    if (stages.length > 1) {
      setStages(stages.filter((_, i) => i !== index))
    }
  }

  const updateStage = (index: number, field: keyof Stage, value: string | number) => {
    const newStages = [...stages]
    newStages[index] = { ...newStages[index], [field]: value }
    setStages(newStages)
  }

  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }])
  }

  const removeEnvVar = (index: number) => {
    if (envVars.length > 1) {
      setEnvVars(envVars.filter((_, i) => i !== index))
    }
  }

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    const newEnvVars = [...envVars]
    newEnvVars[index] = { ...newEnvVars[index], [field]: value }
    setEnvVars(newEnvVars)
  }

  const generateCronExpression = (values: any) => {
    const { frequency, time, dayOfWeek, dayOfMonth } = values
    const hour = time ? time.hour() : 0
    const minute = time ? time.minute() : 0

    switch (frequency) {
      case 'daily':
        return `${minute} ${hour} * * *`
      case 'weekly':
        return `${minute} ${hour} * * ${dayOfWeek || 0}`
      case 'monthly':
        return `${minute} ${hour} ${dayOfMonth || 1} * *`
      default:
        return '0 0 * * *'
    }
  }

  const handleSubmit = async (values: any) => {
    setState(prev => ({ ...prev, submitting: true }))
    try {
      // 构建任务配置
      const config: TaskConfig = {
        vus: values.vus,
        duration: durationType === 'duration' ? values.duration : undefined,
        iterations: durationType === 'iterations' ? values.iterations : undefined,
        stages: useStages ? stages : undefined,
        env: envVars.reduce((acc, item) => {
          if (item.key && item.value) {
            acc[item.key] = item.value
          }
          return acc
        }, {} as Record<string, string>),
        options: {
          maxRedirects: values.maxRedirects,
          insecureSkipTLSVerify: values.insecureSkipTLSVerify,
          paused: values.paused,
          timeout: values.timeout
        }
      }

      // 构建创建任务DTO
      const createTaskDto: CreateTaskDto = {
        name: values.name,
        description: values.description,
        scriptId: values.scriptId,
        agentId: executionMode === 'agent' ? values.agentId : undefined,
        triggerType,
        config,
        cronExpression: triggerType === 'scheduled' ? (
          cronType === 'simple' ? generateCronExpression(values) : values.cronExpression
        ) : undefined,
        scheduledAt: triggerType === 'scheduled' && values.scheduledAt ? values.scheduledAt.toISOString() : undefined
      }

      await taskService.createTask(createTaskDto)
      message.success('任务创建成功')
      navigate('/tasks')
    } catch (error: any) {
      message.error('创建任务失败：' + error.message)
    } finally {
      setState(prev => ({ ...prev, submitting: false }))
    }
  }

  const stageColumns = [
    {
      title: '持续时间',
      dataIndex: 'duration',
      key: 'duration',
      render: (value: string, record: Stage, index: number) => (
        <Input
          value={value}
          onChange={(e) => updateStage(index, 'duration', e.target.value)}
          placeholder="如: 30s, 2m, 1h"
        />
      )
    },
    {
      title: '目标VU数',
      dataIndex: 'target',
      key: 'target',
      render: (value: number, record: Stage, index: number) => (
        <InputNumber
          value={value}
          onChange={(val) => updateStage(index, 'target', val || 0)}
          min={0}
          max={10000}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: Stage, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeStage(index)}
          disabled={stages.length === 1}
        />
      )
    }
  ]

  const envVarColumns = [
    {
      title: '变量名',
      dataIndex: 'key',
      key: 'key',
      render: (value: string, record: any, index: number) => (
        <Input
          value={value}
          onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
          placeholder="如: BASE_URL"
        />
      )
    },
    {
      title: '变量值',
      dataIndex: 'value',
      key: 'value',
      render: (value: string, record: any, index: number) => (
        <Input
          value={value}
          onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
          placeholder="如: https://api.example.com"
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record: any, index: number) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeEnvVar(index)}
          disabled={envVars.length === 1}
        />
      )
    }
  ]

  return (
    <div className="create-task-page">
      <Card>
        <div className="page-header">
          <Title level={2}>创建测试任务</Title>
          <Text type="secondary">
            配置并创建新的k6性能测试任务，支持手动触发和定时执行
          </Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            vus: 10,
            duration: '5m',
            iterations: 100,
            maxRedirects: 10,
            timeout: '30s',
            triggerType: 'manual',
            executionMode: 'agent'
          }}
        >
          <Tabs defaultActiveKey="basic">
            <TabPane tab="基础配置" key="basic">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label="任务名称"
                    name="name"
                    rules={[{ required: true, message: '请输入任务名称' }]}
                  >
                    <Input placeholder="输入任务名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="任务描述"
                    name="description"
                  >
                    <TextArea rows={1} placeholder="输入任务描述（可选）" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Form.Item
                    label="选择测试脚本"
                    name="scriptId"
                    rules={[{ required: true, message: '请选择测试脚本' }]}
                  >
                    <Select
                      placeholder="选择一个k6脚本"
                      onChange={handleScriptChange}
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children as unknown as string)
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {state.scripts && Array.isArray(state.scripts) && state.scripts.map(script => (
                        <Option key={script.id} value={script.id}>
                          {script.name} ({script.type || 'unknown'})
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  {state.selectedScript && (
                    <div className="script-preview">
                      <Space>
                        <Text strong>已选择脚本:</Text>
                        <Text>{state.selectedScript.name}</Text>
                        <Button
                          type="link"
                          icon={<EyeOutlined />}
                          onClick={handlePreviewScript}
                        >
                          预览脚本
                        </Button>
                      </Space>
                    </div>
                  )}
                </Col>
              </Row>
            </TabPane>

            <TabPane tab="测试参数" key="parameters">
              <Card title="负载配置" size="small">
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Form.Item
                      label="虚拟用户数 (VUs)"
                      name="vus"
                      rules={[{ required: true, message: '请输入VU数量' }]}
                    >
                      <InputNumber
                        min={1}
                        max={10000}
                        placeholder="并发用户数"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="执行模式">
                      <Radio.Group
                        value={durationType}
                        onChange={(e) => setDurationType(e.target.value)}
                      >
                        <Radio value="duration">持续时间</Radio>
                        <Radio value="iterations">迭代次数</Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    {durationType === 'duration' ? (
                      <Form.Item
                        label="测试持续时间"
                        name="duration"
                        rules={[{ required: true, message: '请输入持续时间' }]}
                      >
                        <Input placeholder="如: 5m, 1h, 30s" />
                      </Form.Item>
                    ) : (
                      <Form.Item
                        label="迭代次数"
                        name="iterations"
                        rules={[{ required: true, message: '请输入迭代次数' }]}
                      >
                        <InputNumber
                          min={1}
                          placeholder="脚本执行次数"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    )}
                  </Col>
                </Row>

                <Divider />

                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Form.Item>
                      <Checkbox
                        checked={useStages}
                        onChange={(e) => setUseStages(e.target.checked)}
                      >
                        使用阶段配置 (高级选项)
                        <Tooltip title="定义多个阶段，每个阶段有不同的VU数量和持续时间">
                          <InfoCircleOutlined style={{ marginLeft: 4 }} />
                        </Tooltip>
                      </Checkbox>
                    </Form.Item>
                  </Col>
                </Row>

                {useStages && (
                  <Row gutter={[16, 16]}>
                    <Col span={24}>
                      <div className="stages-config">
                        <div className="stages-header">
                          <Text strong>阶段配置</Text>
                          <Button
                            type="dashed"
                            icon={<PlusOutlined />}
                            onClick={addStage}
                          >
                            添加阶段
                          </Button>
                        </div>
                        <Table
                          dataSource={stages}
                          columns={stageColumns}
                          pagination={false}
                          size="small"
                          rowKey={(record, index) => index!}
                        />
                      </div>
                    </Col>
                  </Row>
                )}
              </Card>

              <Card title="环境变量" size="small" style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <div className="env-vars-config">
                      <div className="env-vars-header">
                        <Text>定义在脚本中使用的环境变量</Text>
                        <Button
                          type="dashed"
                          icon={<PlusOutlined />}
                          onClick={addEnvVar}
                        >
                          添加变量
                        </Button>
                      </div>
                      <Table
                        dataSource={envVars}
                        columns={envVarColumns}
                        pagination={false}
                        size="small"
                        rowKey={(record, index) => index!}
                      />
                    </div>
                  </Col>
                </Row>
              </Card>

              <Card title="其他k6参数" size="small" style={{ marginTop: 16 }}>
                <Row gutter={[16, 16]}>
                  <Col span={6}>
                    <Form.Item
                      label="最大重定向次数"
                      name="maxRedirects"
                    >
                      <InputNumber min={0} max={50} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label="请求超时时间"
                      name="timeout"
                    >
                      <Input placeholder="如: 30s" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label="跳过TLS验证"
                      name="insecureSkipTLSVerify"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item
                      label="初始暂停"
                      name="paused"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            <TabPane tab="执行环境" key="environment">
              <Card title="执行模式选择">
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Form.Item label="执行环境">
                      <Radio.Group
                        value={executionMode}
                        onChange={(e) => setExecutionMode(e.target.value)}
                      >
                        <Radio value="agent">
                          指定Agent执行 (推荐)
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            分布式、可扩展、资源隔离
                          </Text>
                        </Radio>
                        <Radio value="platform">
                          平台服务器执行
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            简单模式，适用于开发调试
                          </Text>
                        </Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                </Row>

                {executionMode === 'agent' && (
                  <Row gutter={[16, 16]}>
                    <Col span={12}>
                      <Form.Item
                        label="选择Agent"
                        name="agentId"
                        rules={[{ required: true, message: '请选择执行Agent' }]}
                      >
                        <Select
                          placeholder="选择一个Agent"
                          showSearch
                          filterOption={(input, option) =>
                            (option?.children as unknown as string)
                              .toLowerCase()
                              .includes(input.toLowerCase())
                          }
                        >
                          {state.agents && Array.isArray(state.agents) && state.agents.filter(agent => agent.status === 'online').map(agent => (
                            <Option key={agent.id} value={agent.id}>
                              {agent.name} ({agent.ipAddress}:{agent.port}) - {agent.status}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Alert
                        message="Agent状态"
                        description={`当前有 ${state.agents && Array.isArray(state.agents) ? state.agents.filter(a => a.status === 'online').length : 0} 个在线Agent可用`}
                        type="info"
                        showIcon
                      />
                    </Col>
                  </Row>
                )}

                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Form.Item
                      label="任务超时时间 (分钟)"
                      name="jobTimeout"
                    >
                      <InputNumber
                        min={1}
                        max={1440}
                        placeholder="默认60分钟"
                        style={{ width: '100%' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </TabPane>

            <TabPane tab="触发方式" key="trigger">
              <Card title="触发策略配置">
                <Row gutter={[16, 16]}>
                  <Col span={24}>
                    <Form.Item label="触发方式">
                      <Radio.Group
                        value={triggerType}
                        onChange={(e) => setTriggerType(e.target.value)}
                      >
                        <Radio value="manual">
                          <PlayCircleOutlined /> 手动触发
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            点击按钮立即执行
                          </Text>
                        </Radio>
                        <Radio value="scheduled">
                          <ScheduleOutlined /> 定时触发
                          <Text type="secondary" style={{ marginLeft: 8 }}>
                            按计划自动执行
                          </Text>
                        </Radio>
                      </Radio.Group>
                    </Form.Item>
                  </Col>
                </Row>

                {triggerType === 'scheduled' && (
                  <>
                    <Divider />
                    <Row gutter={[16, 16]}>
                      <Col span={24}>
                        <Form.Item label="定时配置方式">
                          <Radio.Group
                            value={cronType}
                            onChange={(e) => setCronType(e.target.value)}
                          >
                            <Radio value="simple">可视化配置 (推荐)</Radio>
                            <Radio value="advanced">Cron表达式</Radio>
                          </Radio.Group>
                        </Form.Item>
                      </Col>
                    </Row>

                    {cronType === 'simple' ? (
                      <>
                        <Row gutter={[16, 16]}>
                          <Col span={8}>
                            <Form.Item
                              label="执行频率"
                              name="frequency"
                              rules={[{ required: true, message: '请选择执行频率' }]}
                            >
                              <Select placeholder="选择频率">
                                <Option value="once">一次性</Option>
                                <Option value="daily">每天</Option>
                                <Option value="weekly">每周</Option>
                                <Option value="monthly">每月</Option>
                              </Select>
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item
                              label="执行时间"
                              name="time"
                              rules={[{ required: true, message: '请选择执行时间' }]}
                            >
                              <TimePicker
                                format="HH:mm"
                                placeholder="选择时间"
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          </Col>
                          <Col span={8}>
                            <Form.Item
                              label="开始日期"
                              name="scheduledAt"
                            >
                              <DatePicker
                                placeholder="选择开始日期"
                                style={{ width: '100%' }}
                              />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item
                          noStyle
                          shouldUpdate={(prevValues, currentValues) =>
                            prevValues.frequency !== currentValues.frequency
                          }
                        >
                          {({ getFieldValue }) => {
                            const frequency = getFieldValue('frequency')
                            if (frequency === 'weekly') {
                              return (
                                <Row gutter={[16, 16]}>
                                  <Col span={8}>
                                    <Form.Item
                                      label="星期几"
                                      name="dayOfWeek"
                                      rules={[{ required: true, message: '请选择星期几' }]}
                                    >
                                      <Select placeholder="选择星期几">
                                        <Option value={0}>星期日</Option>
                                        <Option value={1}>星期一</Option>
                                        <Option value={2}>星期二</Option>
                                        <Option value={3}>星期三</Option>
                                        <Option value={4}>星期四</Option>
                                        <Option value={5}>星期五</Option>
                                        <Option value={6}>星期六</Option>
                                      </Select>
                                    </Form.Item>
                                  </Col>
                                </Row>
                              )
                            }
                            if (frequency === 'monthly') {
                              return (
                                <Row gutter={[16, 16]}>
                                  <Col span={8}>
                                    <Form.Item
                                      label="每月第几天"
                                      name="dayOfMonth"
                                      rules={[{ required: true, message: '请选择日期' }]}
                                    >
                                      <InputNumber
                                        min={1}
                                        max={31}
                                        placeholder="1-31"
                                        style={{ width: '100%' }}
                                      />
                                    </Form.Item>
                                  </Col>
                                </Row>
                              )
                            }
                            return null
                          }}
                        </Form.Item>
                      </>
                    ) : (
                      <Row gutter={[16, 16]}>
                        <Col span={12}>
                          <Form.Item
                            label="Cron表达式"
                            name="cronExpression"
                            rules={[{ required: true, message: '请输入Cron表达式' }]}
                          >
                            <Input placeholder="如: 0 10 * * * (每天10:00)" />
                          </Form.Item>
                        </Col>
                        <Col span={12}>
                          <Alert
                            message="Cron表达式格式"
                            description="分 时 日 月 周，例如：0 10 * * * 表示每天10:00执行"
                            type="info"
                            showIcon
                          />
                        </Col>
                      </Row>
                    )}
                  </>
                )}
              </Card>
            </TabPane>
          </Tabs>

          <Divider />

          <Row gutter={[16, 16]} justify="end">
            <Col>
              <Space>
                <Button onClick={() => navigate('/tasks')}>取消</Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={state.submitting}
                  icon={<PlayCircleOutlined />}
                >
                  创建任务
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* 脚本预览模态框 */}
      <Modal
        title="脚本预览"
        open={state.previewVisible}
        onCancel={() => setState(prev => ({ ...prev, previewVisible: false }))}
        footer={null}
        width={800}
      >
        {state.selectedScript && (
          <div>
            <Paragraph>
              <Text strong>脚本名称:</Text> {state.selectedScript.name}
            </Paragraph>
            <Paragraph>
              <Text strong>脚本类型:</Text> {state.selectedScript.type}
            </Paragraph>
            <Paragraph>
              <Text strong>描述:</Text> {state.selectedScript.description || '无'}
            </Paragraph>
            <Divider />
            <Text strong>脚本内容:</Text>
            <pre style={{
              background: '#f5f5f5',
              padding: '12px',
              borderRadius: '4px',
              maxHeight: '400px',
              overflow: 'auto',
              marginTop: '8px'
            }}>
              {state.selectedScript.content}
            </pre>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CreateTask