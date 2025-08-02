import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
  Row,
  Col,
  Switch,
  InputNumber,
  DatePicker,
  Checkbox,
  Divider
} from 'antd'
import {
  SaveOutlined,
  ArrowLeftOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  ClockCircleOutlined
} from '@ant-design/icons'
import { taskService, scriptService, agentService } from '../../../services'
import dayjs from 'dayjs'
import './index.css'

const { Title } = Typography
const { TextArea } = Input
const { Option } = Select
const { RangePicker } = DatePicker

interface Task {
  id?: string
  name: string
  description: string
  scriptId: string
  config: {
    vus: number
    duration: string
    environment: string
    parameters: any
    schedule?: {
      enabled: boolean
      type: 'once' | 'recurring'
      startTime?: string
      endTime?: string
      interval?: string
      cron?: string
    }
  }
  enabled: boolean
}

interface Script {
  id: string
  name: string
  language: string
}

const TaskEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [task, setTask] = useState<Task | null>(null)
  const [scripts, setScripts] = useState<Script[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [scheduleType, setScheduleType] = useState<'once' | 'recurring'>('once')

  const isEdit = !!id

  useEffect(() => {
    fetchScripts()
    fetchAgents()
    if (isEdit) {
      fetchTask()
    } else {
      // 新建任务的默认值
      form.setFieldsValue({
        triggerType: 'manual',
        config: {
          vus: 10,
          duration: '30s',
          environment: 'development'
        },
        enabled: true
      })
    }
  }, [id, isEdit, form])

  const fetchScripts = async () => {
    try {
      const response = await scriptService.getScripts()
      setScripts(response.data || [])
    } catch (error) {
      message.error('获取脚本列表失败')
    }
  }

  const fetchAgents = async () => {
    try {
      const response = await agentService.getAgents()
      setAgents(response.data || [])
    } catch (error) {
      message.error('获取Agent列表失败')
    }
  }

  const fetchTask = async () => {
    try {
      setLoading(true)
      const response = await taskService.getTask(id!)
      const taskData = response.data
      setTask(taskData)
      
      const schedule = taskData.config?.schedule
      if (schedule) {
        setScheduleEnabled(schedule.enabled)
        setScheduleType(schedule.type)
      }
      
      form.setFieldsValue({
        ...taskData,
        scheduleTime: schedule?.startTime && schedule?.endTime ? [
          dayjs(schedule.startTime),
          dayjs(schedule.endTime)
        ] : undefined
      })
    } catch (error) {
      message.error('获取任务信息失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (values: any) => {
    try {
      setSaving(true)
      
      const taskData = {
        ...values,
        status: isEdit ? undefined : 'pending', // 新建任务默认状态为等待中
        config: {
          ...values.config,
          parameters: values.config.parameters ? JSON.parse(values.config.parameters) : {},
          schedule: scheduleEnabled ? {
            enabled: true,
            type: scheduleType,
            startTime: values.scheduleTime?.[0]?.toISOString(),
            endTime: values.scheduleTime?.[1]?.toISOString(),
            interval: values.config.schedule?.interval,
            cron: values.config.schedule?.cron
          } : { enabled: false }
        }
      }
      
      delete taskData.scheduleTime

      if (isEdit) {
        await taskService.updateTask(id!, taskData)
        message.success('任务更新成功')
      } else {
        const response = await taskService.createTask(taskData)
        message.success('任务创建成功')
        navigate(`/tasks/${response.id}`)
      }
    } catch (error: any) {
      message.error(isEdit ? '任务更新失败: ' + (error.message || '未知错误') : '任务创建失败: ' + (error.message || '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    try {
      const values = await form.validateFields()
      const taskData = {
        ...values,
        config: {
          ...values.config,
          parameters: values.config.parameters ? JSON.parse(values.config.parameters) : {}
        }
      }
      
      message.loading('正在测试任务配置...', 0)
      await taskService.testTask(taskData)
      message.destroy()
      message.success('任务配置测试通过')
    } catch (error) {
      message.destroy()
      message.error('任务配置测试失败')
    }
  }

  return (
    <div className="task-editor">
      <Card className="editor-header">
        <div className="header-content">
          <div className="header-left">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/tasks')}
              className="back-button"
            >
              返回
            </Button>
            <Title level={2} className="editor-title">
              {isEdit ? '编辑任务' : '新建任务'}
            </Title>
          </div>
          <div className="header-actions">
            <Space>
              <Button 
                icon={<PlayCircleOutlined />}
                onClick={handleTest}
              >
                测试配置
              </Button>
              <Button 
                type="primary" 
                icon={<SaveOutlined />}
                loading={saving}
                onClick={() => form.submit()}
              >
                {isEdit ? '更新' : '保存'}
              </Button>
            </Space>
          </div>
        </div>
      </Card>

      <div className="editor-content">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          loading={loading}
        >
          <Row gutter={24}>
            <Col span={16}>
              <Card title={<span><SettingOutlined />任务配置</span>} className="config-card">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="name"
                      label="任务名称"
                      rules={[{ required: true, message: '请输入任务名称' }]}
                    >
                      <Input placeholder="输入任务名称" />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item
                      name="scriptId"
                      label="关联脚本"
                      rules={[{ required: true, message: '请选择关联脚本' }]}
                    >
                      <Select placeholder="选择脚本">
                        {scripts.map(script => (
                          <Option key={script.id} value={script.id}>
                            {script.name} ({script.language})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item
                  name="description"
                  label="任务描述"
                >
                  <TextArea rows={3} placeholder="输入任务描述" />
                </Form.Item>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="triggerType"
                      label="触发类型"
                      rules={[{ required: true, message: '请选择触发类型' }]}
                    >
                      <Select placeholder="选择触发类型">
                        <Option value="manual">手动触发</Option>
                        <Option value="scheduled">定时触发</Option>
                        <Option value="api">API触发</Option>
                        <Option value="chat">聊天触发</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                
                <Divider orientation="left">执行配置</Divider>
                
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item
                      name={['config', 'vus']}
                      label="虚拟用户数"
                      rules={[{ required: true, message: '请输入虚拟用户数' }]}
                    >
                      <InputNumber min={1} max={10000} placeholder="10" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name={['config', 'duration']}
                      label="执行时长"
                      rules={[{ required: true, message: '请输入执行时长' }]}
                    >
                      <Input placeholder="30s" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item
                      name={['config', 'environment']}
                      label="执行环境"
                      rules={[{ required: true, message: '请选择执行环境' }]}
                    >
                      <Select placeholder="选择环境">
                        <Option value="development">开发环境</Option>
                        <Option value="testing">测试环境</Option>
                        <Option value="staging">预发布环境</Option>
                        <Option value="production">生产环境</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="agentId"
                      label="执行Agent"
                      rules={[{ required: true, message: '请选择执行Agent' }]}
                    >
                      <Select placeholder="选择Agent">
                        <Option value="">平台服务器</Option>
                        {agents.map(agent => (
                          <Option key={agent.id} value={agent.id}>
                            {agent.name} ({agent.hostname})
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                
                <Form.Item
                  name={['config', 'parameters']}
                  label="执行参数"
                >
                  <TextArea 
                    rows={4} 
                    placeholder={`输入执行参数（JSON格式）
例如：{
  "baseUrl": "https://api.example.com",
  "timeout": 30
}`}
                  />
                </Form.Item>
              </Card>
            </Col>
            
            <Col span={8}>
              <Card title={<span><ClockCircleOutlined />调度设置</span>} className="schedule-card">
                <Form.Item
                  name="enabled"
                  label="任务状态"
                  valuePropName="checked"
                >
                  <Switch 
                    checkedChildren="启用" 
                    unCheckedChildren="禁用" 
                  />
                </Form.Item>
                
                <Divider />
                
                <div className="schedule-section">
                  <div className="schedule-header">
                    <Checkbox 
                      checked={scheduleEnabled}
                      onChange={(e) => setScheduleEnabled(e.target.checked)}
                    >
                      启用定时调度
                    </Checkbox>
                  </div>
                  
                  {scheduleEnabled && (
                    <div className="schedule-config">
                      <Form.Item label="调度类型">
                        <Select 
                          value={scheduleType}
                          onChange={setScheduleType}
                          style={{ width: '100%' }}
                        >
                          <Option value="once">单次执行</Option>
                          <Option value="recurring">循环执行</Option>
                        </Select>
                      </Form.Item>
                      
                      <Form.Item
                        name="scheduleTime"
                        label={scheduleType === 'once' ? '执行时间' : '执行时间范围'}
                        rules={[{ required: scheduleEnabled, message: '请选择执行时间' }]}
                      >
                        <RangePicker 
                          showTime
                          format="YYYY-MM-DD HH:mm:ss"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                      
                      {scheduleType === 'recurring' && (
                        <>
                          <Form.Item
                            name={['config', 'schedule', 'interval']}
                            label="执行间隔"
                          >
                            <Select placeholder="选择间隔">
                              <Option value="5m">每5分钟</Option>
                              <Option value="15m">每15分钟</Option>
                              <Option value="30m">每30分钟</Option>
                              <Option value="1h">每小时</Option>
                              <Option value="6h">每6小时</Option>
                              <Option value="12h">每12小时</Option>
                              <Option value="24h">每天</Option>
                            </Select>
                          </Form.Item>
                          
                          <Form.Item
                            name={['config', 'schedule', 'cron']}
                            label="Cron表达式"
                          >
                            <Input placeholder="0 0 * * *" />
                          </Form.Item>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  )
}

export default TaskEditor