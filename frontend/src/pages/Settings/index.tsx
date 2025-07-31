import React, { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Switch,
  Select,
  InputNumber,
  Upload,
  message,
  Tabs,
  Divider,
  Space,
  Typography,
  Row,
  Col,
  Alert,
  Modal,
  Table,
  Tag,
  Popconfirm,
  Tooltip
} from 'antd'
import {
  SaveOutlined,
  ReloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  PlusOutlined,
  EditOutlined,
  KeyOutlined,
  SecurityScanOutlined,
  SettingOutlined,
  DatabaseOutlined,
  CloudOutlined,
  BellOutlined,
  UserOutlined,
  TeamOutlined,
  LockOutlined
} from '@ant-design/icons'
import { settingsService } from '../../services'
import { SystemSettings, NotificationSettings, SecuritySettings, UserSettings } from '../../types/settings'
import './index.css'

const { Title, Text } = Typography
const { TabPane } = Tabs
const { Option } = Select
const { TextArea } = Input

interface SettingsPageState {
  loading: boolean
  saving: boolean
  systemSettings: SystemSettings
  notificationSettings: NotificationSettings
  securitySettings: SecuritySettings
  userSettings: UserSettings
  apiKeys: any[]
  users: any[]
}

const Settings: React.FC = () => {
  const [form] = Form.useForm()
  const [notificationForm] = Form.useForm()
  const [securityForm] = Form.useForm()
  const [userForm] = Form.useForm()
  const [apiKeyForm] = Form.useForm()
  const [userManageForm] = Form.useForm()
  
  const [state, setState] = useState<SettingsPageState>({
    loading: false,
    saving: false,
    systemSettings: {} as SystemSettings,
    notificationSettings: {} as NotificationSettings,
    securitySettings: {} as SecuritySettings,
    userSettings: {} as UserSettings,
    apiKeys: [],
    users: []
  })
  
  const [activeTab, setActiveTab] = useState('system')
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false)
  const [userModalVisible, setUserModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      const [systemRes, notificationRes, securityRes, userRes, apiKeysRes, usersRes] = await Promise.all([
        settingsService.getSystemSettings(),
        settingsService.getNotificationSettings(),
        settingsService.getSecuritySettings(),
        settingsService.getUserSettings(),
        settingsService.getApiKeys(),
        settingsService.getUsers()
      ])
      
      setState(prev => ({
        ...prev,
        systemSettings: systemRes.data,
        notificationSettings: notificationRes.data,
        securitySettings: securityRes.data,
        userSettings: userRes.data,
        apiKeys: apiKeysRes.data,
        users: usersRes.data
      }))
      
      // 设置表单初始值
      form.setFieldsValue(systemRes.data)
      notificationForm.setFieldsValue(notificationRes.data)
      securityForm.setFieldsValue(securityRes.data)
      userForm.setFieldsValue(userRes.data)
    } catch (error: any) {
      message.error(error.message || '加载设置失败')
    } finally {
      setState(prev => ({ ...prev, loading: false }))
    }
  }

  const handleSystemSettingsSave = async (values: any) => {
    setState(prev => ({ ...prev, saving: true }))
    try {
      await settingsService.updateSystemSettings(values)
      setState(prev => ({ ...prev, systemSettings: values }))
      message.success('系统设置保存成功')
    } catch (error: any) {
      message.error(error.message || '保存失败')
    } finally {
      setState(prev => ({ ...prev, saving: false }))
    }
  }

  const handleNotificationSettingsSave = async (values: any) => {
    setState(prev => ({ ...prev, saving: true }))
    try {
      await settingsService.updateNotificationSettings(values)
      setState(prev => ({ ...prev, notificationSettings: values }))
      message.success('通知设置保存成功')
    } catch (error: any) {
      message.error(error.message || '保存失败')
    } finally {
      setState(prev => ({ ...prev, saving: false }))
    }
  }

  const handleSecuritySettingsSave = async (values: any) => {
    setState(prev => ({ ...prev, saving: true }))
    try {
      await settingsService.updateSecuritySettings(values)
      setState(prev => ({ ...prev, securitySettings: values }))
      message.success('安全设置保存成功')
    } catch (error: any) {
      message.error(error.message || '保存失败')
    } finally {
      setState(prev => ({ ...prev, saving: false }))
    }
  }

  const handleUserSettingsSave = async (values: any) => {
    setState(prev => ({ ...prev, saving: true }))
    try {
      await settingsService.updateUserSettings(values)
      setState(prev => ({ ...prev, userSettings: values }))
      message.success('用户设置保存成功')
    } catch (error: any) {
      message.error(error.message || '保存失败')
    } finally {
      setState(prev => ({ ...prev, saving: false }))
    }
  }

  const handleCreateApiKey = async (values: any) => {
    try {
      const response = await settingsService.createApiKey(values)
      setState(prev => ({ ...prev, apiKeys: [...prev.apiKeys, response.data] }))
      setApiKeyModalVisible(false)
      apiKeyForm.resetFields()
      message.success('API密钥创建成功')
      
      // 显示新创建的密钥
      Modal.info({
        title: 'API密钥创建成功',
        content: (
          <div>
            <p>请妥善保存以下密钥，它只会显示一次：</p>
            <Input.TextArea
              value={response.data.key}
              readOnly
              rows={3}
              style={{ fontFamily: 'monospace' }}
            />
          </div>
        ),
        width: 600
      })
    } catch (error: any) {
      message.error(error.message || '创建失败')
    }
  }

  const handleDeleteApiKey = async (id: string) => {
    try {
      await settingsService.deleteApiKey(id)
      setState(prev => ({ ...prev, apiKeys: prev.apiKeys.filter(key => key.id !== id) }))
      message.success('API密钥删除成功')
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  const handleCreateUser = async (values: any) => {
    try {
      const response = await settingsService.createUser(values)
      setState(prev => ({ ...prev, users: [...prev.users, response.data] }))
      setUserModalVisible(false)
      userManageForm.resetFields()
      setEditingUser(null)
      message.success('用户创建成功')
    } catch (error: any) {
      message.error(error.message || '创建失败')
    }
  }

  const handleUpdateUser = async (values: any) => {
    try {
      const response = await settingsService.updateUser(editingUser.id, values)
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => user.id === editingUser.id ? response.data : user)
      }))
      setUserModalVisible(false)
      userManageForm.resetFields()
      setEditingUser(null)
      message.success('用户更新成功')
    } catch (error: any) {
      message.error(error.message || '更新失败')
    }
  }

  const handleDeleteUser = async (id: string) => {
    try {
      await settingsService.deleteUser(id)
      setState(prev => ({ ...prev, users: prev.users.filter(user => user.id !== id) }))
      message.success('用户删除成功')
    } catch (error: any) {
      message.error(error.message || '删除失败')
    }
  }

  const handleTestConnection = async (type: string) => {
    try {
      await settingsService.testConnection(type)
      message.success('连接测试成功')
    } catch (error: any) {
      message.error(error.message || '连接测试失败')
    }
  }

  const apiKeyColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions: string[]) => (
        <Space wrap>
          {permissions.map(permission => (
            <Tag key={permission}>{permission}</Tag>
          ))}
        </Space>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString()
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsedAt',
      key: 'lastUsedAt',
      render: (date: string) => date ? new Date(date).toLocaleString() : '从未使用'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: any) => (
        <Popconfirm
          title="确定要删除这个API密钥吗？"
          onConfirm={() => handleDeleteApiKey(record.id)}
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ]

  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => {
        const colors = {
          admin: 'red',
          user: 'blue',
          viewer: 'green'
        }
        return <Tag color={colors[role as keyof typeof colors]}>{role}</Tag>
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '活跃' : '禁用'}
        </Tag>
      )
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => date ? new Date(date).toLocaleString() : '从未登录'
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: any) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => {
                setEditingUser(record)
                userManageForm.setFieldsValue(record)
                setUserModalVisible(true)
              }}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个用户吗？"
            onConfirm={() => handleDeleteUser(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="settings-container">
      <Card className="settings-header-card">
        <Title level={2}>系统设置</Title>
        <Text type="secondary">配置系统参数、通知设置、安全策略等</Text>
      </Card>

      <Card className="settings-content-card">
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab={<span><SettingOutlined />系统设置</span>} key="system">
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSystemSettingsSave}
              initialValues={state.systemSettings}
            >
              <Row gutter={[24, 0]}>
                <Col xs={24} md={12}>
                  <Card title="基础设置" size="small">
                    <Form.Item
                      label="系统名称"
                      name="systemName"
                      rules={[{ required: true, message: '请输入系统名称' }]}
                    >
                      <Input placeholder="K6 Auto Testing Platform" />
                    </Form.Item>
                    
                    <Form.Item
                      label="系统描述"
                      name="systemDescription"
                    >
                      <TextArea rows={3} placeholder="系统描述信息" />
                    </Form.Item>
                    
                    <Form.Item
                      label="默认语言"
                      name="defaultLanguage"
                    >
                      <Select>
                        <Option value="zh-CN">中文</Option>
                        <Option value="en-US">English</Option>
                      </Select>
                    </Form.Item>
                    
                    <Form.Item
                      label="时区"
                      name="timezone"
                    >
                      <Select>
                        <Option value="Asia/Shanghai">Asia/Shanghai</Option>
                        <Option value="UTC">UTC</Option>
                        <Option value="America/New_York">America/New_York</Option>
                      </Select>
                    </Form.Item>
                  </Card>
                </Col>
                
                <Col xs={24} md={12}>
                  <Card title="性能设置" size="small">
                    <Form.Item
                      label="最大并发任务数"
                      name="maxConcurrentTasks"
                      rules={[{ required: true, message: '请输入最大并发任务数' }]}
                    >
                      <InputNumber min={1} max={100} style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      label="任务超时时间（分钟）"
                      name="taskTimeout"
                    >
                      <InputNumber min={1} max={1440} style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      label="结果保留天数"
                      name="resultRetentionDays"
                    >
                      <InputNumber min={1} max={365} style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      label="启用缓存"
                      name="enableCache"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Card>
                </Col>
              </Row>
              
              <Divider />
              
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={state.saving}
                  >
                    保存设置
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => form.setFieldsValue(state.systemSettings)}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab={<span><BellOutlined />通知设置</span>} key="notification">
            <Form
              form={notificationForm}
              layout="vertical"
              onFinish={handleNotificationSettingsSave}
              initialValues={state.notificationSettings}
            >
              <Row gutter={[24, 0]}>
                <Col xs={24} md={12}>
                  <Card title="邮件通知" size="small">
                    <Form.Item
                      label="启用邮件通知"
                      name="emailEnabled"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                    
                    <Form.Item
                      label="SMTP服务器"
                      name="smtpHost"
                    >
                      <Input placeholder="smtp.example.com" />
                    </Form.Item>
                    
                    <Form.Item
                      label="SMTP端口"
                      name="smtpPort"
                    >
                      <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      label="发件人邮箱"
                      name="senderEmail"
                    >
                      <Input placeholder="noreply@example.com" />
                    </Form.Item>
                    
                    <Form.Item>
                      <Button onClick={() => handleTestConnection('email')}>测试邮件连接</Button>
                    </Form.Item>
                  </Card>
                </Col>
                
                <Col xs={24} md={12}>
                  <Card title="Webhook通知" size="small">
                    <Form.Item
                      label="启用Webhook"
                      name="webhookEnabled"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                    
                    <Form.Item
                      label="Webhook URL"
                      name="webhookUrl"
                    >
                      <Input placeholder="https://hooks.example.com/webhook" />
                    </Form.Item>
                    
                    <Form.Item
                      label="Secret Token"
                      name="webhookSecret"
                    >
                      <Input.Password placeholder="webhook secret" />
                    </Form.Item>
                    
                    <Form.Item>
                      <Button onClick={() => handleTestConnection('webhook')}>测试Webhook</Button>
                    </Form.Item>
                  </Card>
                </Col>
              </Row>
              
              <Divider />
              
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={state.saving}
                  >
                    保存设置
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => notificationForm.setFieldsValue(state.notificationSettings)}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab={<span><SecurityScanOutlined />安全设置</span>} key="security">
            <Form
              form={securityForm}
              layout="vertical"
              onFinish={handleSecuritySettingsSave}
              initialValues={state.securitySettings}
            >
              <Row gutter={[24, 0]}>
                <Col xs={24} md={12}>
                  <Card title="认证设置" size="small">
                    <Form.Item
                      label="启用双因子认证"
                      name="enableTwoFactor"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                    
                    <Form.Item
                      label="会话超时时间（小时）"
                      name="sessionTimeout"
                    >
                      <InputNumber min={1} max={24} style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      label="密码最小长度"
                      name="minPasswordLength"
                    >
                      <InputNumber min={6} max={32} style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      label="密码复杂度要求"
                      name="passwordComplexity"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                  </Card>
                </Col>
                
                <Col xs={24} md={12}>
                  <Card title="访问控制" size="small">
                    <Form.Item
                      label="启用IP白名单"
                      name="enableIpWhitelist"
                      valuePropName="checked"
                    >
                      <Switch />
                    </Form.Item>
                    
                    <Form.Item
                      label="IP白名单"
                      name="ipWhitelist"
                    >
                      <TextArea
                        rows={4}
                        placeholder="每行一个IP地址或CIDR块\n例如：192.168.1.0/24"
                      />
                    </Form.Item>
                    
                    <Form.Item
                      label="最大登录尝试次数"
                      name="maxLoginAttempts"
                    >
                      <InputNumber min={3} max={10} style={{ width: '100%' }} />
                    </Form.Item>
                    
                    <Form.Item
                      label="锁定时间（分钟）"
                      name="lockoutDuration"
                    >
                      <InputNumber min={5} max={60} style={{ width: '100%' }} />
                    </Form.Item>
                  </Card>
                </Col>
              </Row>
              
              <Divider />
              
              <Form.Item>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SaveOutlined />}
                    loading={state.saving}
                  >
                    保存设置
                  </Button>
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={() => securityForm.setFieldsValue(state.securitySettings)}
                  >
                    重置
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </TabPane>

          <TabPane tab={<span><KeyOutlined />API密钥</span>} key="apikeys">
            <div className="api-keys-section">
              <div className="section-header">
                <Title level={4}>API密钥管理</Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setApiKeyModalVisible(true)}
                >
                  创建API密钥
                </Button>
              </div>
              
              <Alert
                message="安全提示"
                description="API密钥具有完整的系统访问权限，请妥善保管。密钥创建后只显示一次，请及时保存。"
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
              />
              
              <Table
                columns={apiKeyColumns}
                dataSource={state.apiKeys}
                rowKey="id"
                pagination={false}
              />
            </div>
          </TabPane>

          <TabPane tab={<span><TeamOutlined />用户管理</span>} key="users">
            <div className="users-section">
              <div className="section-header">
                <Title level={4}>用户管理</Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setEditingUser(null)
                    userManageForm.resetFields()
                    setUserModalVisible(true)
                  }}
                >
                  添加用户
                </Button>
              </div>
              
              <Table
                columns={userColumns}
                dataSource={state.users}
                rowKey="id"
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true
                }}
              />
            </div>
          </TabPane>
        </Tabs>
      </Card>

      {/* API密钥创建模态框 */}
      <Modal
        title="创建API密钥"
        open={apiKeyModalVisible}
        onCancel={() => setApiKeyModalVisible(false)}
        footer={null}
      >
        <Form
          form={apiKeyForm}
          layout="vertical"
          onFinish={handleCreateApiKey}
        >
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入密钥名称' }]}
          >
            <Input placeholder="API密钥名称" />
          </Form.Item>
          
          <Form.Item
            label="描述"
            name="description"
          >
            <TextArea rows={3} placeholder="密钥用途描述" />
          </Form.Item>
          
          <Form.Item
            label="权限"
            name="permissions"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Select mode="multiple" placeholder="选择权限">
              <Option value="read">读取</Option>
              <Option value="write">写入</Option>
              <Option value="delete">删除</Option>
              <Option value="admin">管理员</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建
              </Button>
              <Button onClick={() => setApiKeyModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 用户管理模态框 */}
      <Modal
        title={editingUser ? '编辑用户' : '添加用户'}
        open={userModalVisible}
        onCancel={() => {
          setUserModalVisible(false)
          setEditingUser(null)
          userManageForm.resetFields()
        }}
        footer={null}
      >
        <Form
          form={userManageForm}
          layout="vertical"
          onFinish={editingUser ? handleUpdateUser : handleCreateUser}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="用户名" disabled={!!editingUser} />
          </Form.Item>
          
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input placeholder="邮箱地址" />
          </Form.Item>
          
          {!editingUser && (
            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="密码" />
            </Form.Item>
          )}
          
          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="选择角色">
              <Option value="admin">管理员</Option>
              <Option value="user">用户</Option>
              <Option value="viewer">查看者</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="选择状态">
              <Option value="active">活跃</Option>
              <Option value="inactive">禁用</Option>
            </Select>
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingUser ? '更新' : '创建'}
              </Button>
              <Button onClick={() => {
                setUserModalVisible(false)
                setEditingUser(null)
                userManageForm.resetFields()
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default Settings